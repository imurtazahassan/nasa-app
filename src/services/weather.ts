import type { SourceEnvelope, WeatherDailyPoint, WeatherPayload } from '../types/telemetry';
import { getCached, setCached, TTL_MS } from '../utils/cache';
import { fetchJson } from './http';

interface OpenMeteoForecastResponse {
  timezone?: string;
  daily?: {
    time?: string[];
    precipitation_sum?: (number | null)[];
    temperature_2m_max?: (number | null)[];
  };
}

export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  forceRefresh = false
): Promise<SourceEnvelope<WeatherPayload>> {
  const cacheKey = `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;

  if (!forceRefresh) {
    const cached = getCached<WeatherPayload>(cacheKey, TTL_MS.FORECAST);
    if (cached) {
      return {
        data: cached.data,
        fetchedAt: cached.timestamp,
        observationDate: cached.data.series[7]?.date || cached.data.series[0]?.date || null,
        stale: cached.stale,
        error: null,
        fromCache: true,
      };
    }
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
    4
  )}&longitude=${lon.toFixed(4)}&daily=precipitation_sum,temperature_2m_max&past_days=7&forecast_days=7&timezone=auto`;

  try {
    const json = await fetchJson<OpenMeteoForecastResponse>(url);
    const dates = json.daily?.time || [];
    const precips = json.daily?.precipitation_sum || [];
    const temps = json.daily?.temperature_2m_max || [];

    const series: WeatherDailyPoint[] = dates.map((date, idx) => ({
      date,
      precipMm: typeof precips[idx] === 'number' ? Number(precips[idx]!.toFixed(1)) : null,
      tempMaxC: typeof temps[idx] === 'number' ? Number(temps[idx]!.toFixed(1)) : null,
      isForecast: idx >= 7,
    }));

    const pastSlice = series.slice(0, 7).map((d) => d.precipMm).filter((v): v is number => v !== null);
    const next3Slice = series.slice(7, 10).map((d) => d.precipMm).filter((v): v is number => v !== null);
    const next7Slice = series.slice(7, 14).map((d) => d.precipMm).filter((v): v is number => v !== null);
    const forecastTemps = series.slice(7, 14).map((d) => d.tempMaxC).filter((v): v is number => v !== null);

    const trailing7dRainMm =
      pastSlice.length > 0 ? Number(pastSlice.reduce((a, b) => a + b, 0).toFixed(1)) : null;
    const next3dRainMm =
      next3Slice.length > 0 ? Number(next3Slice.reduce((a, b) => a + b, 0).toFixed(1)) : null;
    const next7dRainMm =
      next7Slice.length > 0 ? Number(next7Slice.reduce((a, b) => a + b, 0).toFixed(1)) : null;
    const maxForecastTempC =
      forecastTemps.length > 0 ? Math.max(...forecastTemps) : null;

    const payload: WeatherPayload = {
      timezone: json.timezone || 'UTC',
      series,
      trailing7dRainMm,
      next3dRainMm,
      next7dRainMm,
      maxForecastTempC,
    };

    const timestamp = setCached(cacheKey, payload);
    return {
      data: payload,
      fetchedAt: timestamp,
      observationDate: series[7]?.date || series[series.length - 1]?.date || null,
      stale: false,
      error: null,
      fromCache: false,
    };
  } catch (err) {
    const expired = getCached<WeatherPayload>(cacheKey, TTL_MS.FORECAST, true);
    if (expired) {
      return {
        data: expired.data,
        fetchedAt: expired.timestamp,
        observationDate: expired.data.series[7]?.date || null,
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
      error: err instanceof Error ? err.message : 'Weather forecast unavailable',
      fromCache: false,
    };
  }
}
