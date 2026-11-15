import type { FirmsDetection, FirmsPayload, RadiusKm, SourceEnvelope } from '../types/telemetry';
import { getCached, safeGetItem, setCached, TTL_MS } from '../utils/cache';
import { fetchWithRetry } from './http';

export const FIRMS_STORAGE_KEY = 'earthpulse_firms_key';

export function resolveFirmsApiKey(): string {
  const local = safeGetItem(FIRMS_STORAGE_KEY)?.trim() || '';
  const envKey = (import.meta.env?.VITE_NASA_FIRMS_KEY as string | undefined)?.trim() || '';
  return local || envKey;
}

interface FirmsProxyResponse {
  detections?: FirmsDetection[];
  hasApiKey?: boolean;
  fallbackMode?: boolean;
  error?: string;
}

export async function fetchFirmsDetections(
  lat: number,
  lon: number,
  radiusKm: RadiusKm,
  forceRefresh = false
): Promise<SourceEnvelope<FirmsPayload>> {
  const apiKey = resolveFirmsApiKey();
  const cacheKey = `firms:${lat.toFixed(2)},${lon.toFixed(2)}:${radiusKm}:${apiKey ? 'user' : 'server'}`;

  if (!forceRefresh) {
    const cached = getCached<FirmsPayload>(cacheKey, TTL_MS.FIRMS);
    if (cached && cached.data.hasApiKey && !cached.data.fallbackMode) {
      return {
        data: cached.data,
        fetchedAt: cached.timestamp,
        observationDate:
          cached.data.detections[0]?.acqDate || new Date(cached.timestamp).toISOString().slice(0, 10),
        stale: cached.stale,
        error: null,
        fromCache: true,
      };
    }
  }

  const params = new URLSearchParams({
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    radiusKm: String(radiusKm),
  });

  try {
    const res = await fetchWithRetry(
      `/api/firms?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          ...(apiKey ? { 'x-firms-key': apiKey } : {}),
        },
      },
      12000
    );

    const json = (await res.json()) as FirmsProxyResponse;
    const detections = Array.isArray(json.detections) ? json.detections : [];
    const hasApiKey = Boolean(json.hasApiKey);
    const fallbackMode = Boolean(json.fallbackMode);

    if (!hasApiKey || fallbackMode) {
      return {
        data: {
          detections: [],
          hasApiKey,
          fallbackMode: true,
        },
        fetchedAt: Date.now(),
        observationDate: new Date().toISOString().slice(0, 10),
        stale: false,
        error: null,
        fromCache: false,
      };
    }

    const payload: FirmsPayload = {
      detections,
      hasApiKey: true,
      fallbackMode: false,
    };
    const timestamp = setCached(cacheKey, payload);
    return {
      data: payload,
      fetchedAt: timestamp,
      observationDate: detections[0]?.acqDate || new Date(timestamp).toISOString().slice(0, 10),
      stale: false,
      error: null,
      fromCache: false,
    };
  } catch (err) {
    const expired = getCached<FirmsPayload>(cacheKey, TTL_MS.FIRMS, true);
    if (expired && expired.data.hasApiKey && !expired.data.fallbackMode) {
      return {
        data: expired.data,
        fetchedAt: expired.timestamp,
        observationDate:
          expired.data.detections[0]?.acqDate ||
          new Date(expired.timestamp).toISOString().slice(0, 10),
        stale: true,
        error: null,
        fromCache: true,
        sourceNote: 'Showing cached FIRMS detections',
      };
    }

    return {
      data: {
        detections: [],
        hasApiKey: Boolean(apiKey),
        fallbackMode: true,
      },
      fetchedAt: Date.now(),
      observationDate: new Date().toISOString().slice(0, 10),
      stale: false,
      error: null,
      fromCache: false,
      sourceNote:
        err instanceof Error
          ? `Using NASA EONET + GIBS Thermal layer (FIRMS proxy fallback: ${err.message})`
          : 'Using NASA EONET + GIBS Thermal layer',
    };
  }
}
