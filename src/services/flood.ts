import type { FloodDailyPoint, FloodPayload, SourceEnvelope } from '../types/telemetry';
import { getCached, setCached, TTL_MS } from '../utils/cache';
import { fetchJson } from './http';

interface OpenMeteoFloodResponse {
  daily?: {
    time?: string[];
    river_discharge?: (number | null)[];
    river_discharge_mean?: (number | null)[];
    river_discharge_max?: (number | null)[];
  };
}

export async function fetchFloodData(
  lat: number,
  lon: number,
  forceRefresh = false
): Promise<SourceEnvelope<FloodPayload>> {
  const cacheKey = `flood:${lat.toFixed(2)},${lon.toFixed(2)}`;

  if (!forceRefresh) {
    const cached = getCached<FloodPayload>(cacheKey, TTL_MS.FLOOD);
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

  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat.toFixed(
    4
  )}&longitude=${lon.toFixed(4)}&daily=river_discharge,river_discharge_mean,river_discharge_max&past_days=7&forecast_days=7`;

  try {
    const json = await fetchJson<OpenMeteoFloodResponse>(url);
    const dates = json.daily?.time || [];
    const dis = json.daily?.river_discharge || [];
    const disMean = json.daily?.river_discharge_mean || [];
    const disMax = json.daily?.river_discharge_max || [];

    const series: FloodDailyPoint[] = dates.map((date, idx) => ({
      date,
      discharge: typeof dis[idx] === 'number' ? Number(dis[idx]!.toFixed(2)) : null,
      dischargeMean: typeof disMean[idx] === 'number' ? Number(disMean[idx]!.toFixed(2)) : null,
      dischargeMax: typeof disMax[idx] === 'number' ? Number(disMax[idx]!.toFixed(2)) : null,
      isForecast: idx >= 7,
    }));

    const forecastMaxCandidates = series
      .slice(7)
      .map((s) => s.dischargeMax ?? s.discharge)
      .filter((v): v is number => v !== null);

    const meanCandidates = series
      .map((s) => s.dischargeMean ?? s.discharge)
      .filter((v): v is number => v !== null && v > 0);

    const forecastMaxDischarge =
      forecastMaxCandidates.length > 0 ? Math.max(...forecastMaxCandidates) : null;

    const baselineMeanDischarge =
      meanCandidates.length > 0
        ? Number((meanCandidates.reduce((a, b) => a + b, 0) / meanCandidates.length).toFixed(2))
        : null;

    const dischargeRatio =
      forecastMaxDischarge !== null && baselineMeanDischarge !== null && baselineMeanDischarge > 0
        ? Number((forecastMaxDischarge / baselineMeanDischarge).toFixed(2))
        : null;

    const payload: FloodPayload = {
      series,
      forecastMaxDischarge,
      baselineMeanDischarge,
      dischargeRatio,
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
    const expired = getCached<FloodPayload>(cacheKey, TTL_MS.FLOOD, true);
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
      error: err instanceof Error ? err.message : 'Global Flood API unavailable',
      fromCache: false,
    };
  }
}
