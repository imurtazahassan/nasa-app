import type { PowerDailyPoint, PowerPayload, SourceEnvelope } from '../types/telemetry';
import { getCached, setCached, TTL_MS } from '../utils/cache';
import { fetchJson } from './http';

interface PowerApiResponse {
  properties?: {
    parameter?: {
      PRECTOTCORR?: Record<string, number>;
      GWETROOT?: Record<string, number>;
      GWETTOP?: Record<string, number>;
      T2M_MAX?: Record<string, number>;
    };
  };
}

function formatYyyymmdd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function formatIsoFromYyyymmdd(s: string): string {
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function cleanPowerVal(val: number | undefined): number | null {
  if (typeof val !== 'number' || !Number.isFinite(val) || val <= -900) return null;
  return Number(val.toFixed(3));
}

export async function fetchPowerData(
  lat: number,
  lon: number,
  forceRefresh = false
): Promise<SourceEnvelope<PowerPayload>> {
  const cacheKey = `power:${lat.toFixed(2)},${lon.toFixed(2)}`;

  if (!forceRefresh) {
    const cached = getCached<PowerPayload>(cacheKey, TTL_MS.POWER);
    if (cached) {
      return {
        data: cached.data,
        fetchedAt: cached.timestamp,
        observationDate: cached.data.latestValidDate,
        stale: cached.stale,
        error: null,
        fromCache: true,
      };
    }
  }

  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,GWETROOT,GWETTOP,T2M_MAX&community=AG&longitude=${lon.toFixed(
    4
  )}&latitude=${lat.toFixed(4)}&start=${formatYyyymmdd(start)}&end=${formatYyyymmdd(end)}&format=JSON`;

  try {
    const json = await fetchJson<PowerApiResponse>(url);
    const params = json.properties?.parameter;
    if (!params) {
      throw new Error('Missing POWER parameter block');
    }

    const dates = Object.keys(params.GWETROOT || params.PRECTOTCORR || {}).sort();
    const series: PowerDailyPoint[] = dates.map((d) => ({
      date: formatIsoFromYyyymmdd(d),
      precipMm: cleanPowerVal(params.PRECTOTCORR?.[d]),
      gwetRoot: cleanPowerVal(params.GWETROOT?.[d]),
      gwetTop: cleanPowerVal(params.GWETTOP?.[d]),
      t2mMaxC: cleanPowerVal(params.T2M_MAX?.[d]),
    }));

    let latestValidDate: string | null = null;
    let latestGwetRoot: number | null = null;
    let latestGwetTop: number | null = null;
    let latestT2mMaxC: number | null = null;

    for (let i = series.length - 1; i >= 0; i--) {
      const pt = series[i];
      if (latestGwetRoot === null && pt.gwetRoot !== null) {
        latestGwetRoot = pt.gwetRoot;
        latestValidDate = pt.date;
      }
      if (latestGwetTop === null && pt.gwetTop !== null) {
        latestGwetTop = pt.gwetTop;
      }
      if (latestT2mMaxC === null && pt.t2mMaxC !== null) {
        latestT2mMaxC = pt.t2mMaxC;
      }
    }

    const validPrecips = series.map((s) => s.precipMm).filter((v): v is number => v !== null);
    const precip30dMm =
      validPrecips.length > 0
        ? Number(validPrecips.reduce((acc, v) => acc + v, 0).toFixed(1))
        : null;

    const payload: PowerPayload = {
      series,
      latestValidDate,
      latestGwetRoot,
      latestGwetTop,
      latestT2mMaxC,
      precip30dMm,
    };

    const timestamp = setCached(cacheKey, payload);
    return {
      data: payload,
      fetchedAt: timestamp,
      observationDate: latestValidDate,
      stale: false,
      error: null,
      fromCache: false,
    };
  } catch (err) {
    const expired = getCached<PowerPayload>(cacheKey, TTL_MS.POWER, true);
    if (expired) {
      return {
        data: expired.data,
        fetchedAt: expired.timestamp,
        observationDate: expired.data.latestValidDate,
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
      error: err instanceof Error ? err.message : 'NASA POWER unavailable',
      fromCache: false,
    };
  }
}
