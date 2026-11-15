import type { AirDailyPoint, AirQualityPayload, SourceEnvelope } from '../types/telemetry';
import { getCached, setCached, TTL_MS } from '../utils/cache';
import { fetchJson } from './http';

interface OpenMeteoAirResponse {
  current?: {
    time?: string;
    us_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
  };
  hourly?: {
    time?: string[];
    us_aqi?: (number | null)[];
  };
}

export async function fetchAirQuality(
  lat: number,
  lon: number,
  forceRefresh = false
): Promise<SourceEnvelope<AirQualityPayload>> {
  const cacheKey = `air:${lat.toFixed(2)},${lon.toFixed(2)}`;

  if (!forceRefresh) {
    const cached = getCached<AirQualityPayload>(cacheKey, TTL_MS.AIR_QUALITY);
    if (cached) {
      return {
        data: cached.data,
        fetchedAt: cached.timestamp,
        observationDate: cached.data.observedAt?.slice(0, 10) || null,
        stale: cached.stale,
        error: null,
        fromCache: true,
      };
    }
  }

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(
    4
  )}&longitude=${lon.toFixed(
    4
  )}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&past_days=30&forecast_days=3&timezone=auto`;

  try {
    const json = await fetchJson<OpenMeteoAirResponse>(url);
    const times = json.hourly?.time || [];
    const aqis = json.hourly?.us_aqi || [];

    const dailyMaxMap = new Map<string, number>();
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const val = aqis[i];
      if (!t || typeof val !== 'number' || !Number.isFinite(val)) continue;
      const day = t.slice(0, 10);
      const prev = dailyMaxMap.get(day);
      if (prev === undefined || val > prev) {
        dailyMaxMap.set(day, Math.round(val));
      }
    }

    const sortedDays = Array.from(dailyMaxMap.keys()).sort();
    const dailySeries: AirDailyPoint[] = sortedDays.map((date) => ({
      date,
      maxUsAqi: dailyMaxMap.get(date) ?? null,
    }));

    // Count days over 100 US AQI in past 30 days (up to today)
    const todayStr = (json.current?.time || new Date().toISOString()).slice(0, 10);
    const past30 = dailySeries.filter((d) => d.date <= todayStr).slice(-30);
    const daysOver100Last30d =
      past30.length > 0
        ? past30.filter((d) => d.maxUsAqi !== null && d.maxUsAqi > 100).length
        : null;

    const currentUsAqi =
      typeof json.current?.us_aqi === 'number' ? Math.round(json.current.us_aqi) : null;
    const currentPm25 =
      typeof json.current?.pm2_5 === 'number' ? Number(json.current.pm2_5.toFixed(1)) : null;
    const currentPm10 =
      typeof json.current?.pm10 === 'number' ? Number(json.current.pm10.toFixed(1)) : null;

    const payload: AirQualityPayload = {
      currentUsAqi,
      currentPm25,
      currentPm10,
      dailySeries,
      daysOver100Last30d,
      observedAt: json.current?.time || null,
    };

    const timestamp = setCached(cacheKey, payload);
    return {
      data: payload,
      fetchedAt: timestamp,
      observationDate: payload.observedAt?.slice(0, 10) || new Date(timestamp).toISOString().slice(0, 10),
      stale: false,
      error: null,
      fromCache: false,
    };
  } catch (err) {
    const expired = getCached<AirQualityPayload>(cacheKey, TTL_MS.AIR_QUALITY, true);
    if (expired) {
      return {
        data: expired.data,
        fetchedAt: expired.timestamp,
        observationDate: expired.data.observedAt?.slice(0, 10) || null,
        stale: true,
        error: null,
        fromCache: true,
      };
    }

    return {
      data: null,
      fetchedAt: null,
      observationDate: null,
      stale: false,
      error: err instanceof Error ? err.message : 'Air Quality API unavailable',
      fromCache: false,
    };
  }
}
