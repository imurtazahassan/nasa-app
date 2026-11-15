import type { FirmsDetection, FirmsPayload, RadiusKm, SourceEnvelope } from '../types/telemetry';
import { getCached, safeGetItem, setCached, TTL_MS } from '../utils/cache';
import { bearingTo16Point, boundingBox, forwardBearingDeg, haversineKm } from '../utils/geo';
import { fetchText } from './http';

export const FIRMS_STORAGE_KEY = 'earthpulse_firms_key';

export function resolveFirmsApiKey(): string {
  const local = safeGetItem(FIRMS_STORAGE_KEY)?.trim() || '';
  const envKey = (import.meta.env?.VITE_NASA_FIRMS_KEY as string | undefined)?.trim() || '';
  return local || envKey;
}

function parseFirmsCsv(
  csvText: string,
  centerLat: number,
  centerLon: number,
  radiusKm: RadiusKm
): FirmsDetection[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idxLat = headers.indexOf('latitude');
  const idxLon = headers.indexOf('longitude');
  const idxBright = headers.indexOf('bright_ti4');
  const idxDate = headers.indexOf('acq_date');
  const idxTime = headers.indexOf('acq_time');
  const idxConf = headers.indexOf('confidence');
  const idxFrp = headers.indexOf('frp');

  if (idxLat === -1 || idxLon === -1) return [];

  const detections: FirmsDetection[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < headers.length) continue;

    const confRaw = (cols[idxConf] || '').trim().toLowerCase();
    // Discard low-confidence detections ('l' or 'low')
    if (confRaw === 'l' || confRaw === 'low') continue;

    const lat = Number.parseFloat(cols[idxLat]);
    const lon = Number.parseFloat(cols[idxLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const distanceKm = haversineKm(centerLat, centerLon, lat, lon);
    if (distanceKm > radiusKm) continue;

    const bearingDeg = forwardBearingDeg(centerLat, centerLon, lat, lon);
    const bearingCardinal = bearingTo16Point(bearingDeg);
    const brightTi4 = idxBright >= 0 ? Number.parseFloat(cols[idxBright]) || 0 : 0;
    const frp = idxFrp >= 0 ? Number.parseFloat(cols[idxFrp]) || 0 : 0;
    const acqDate = idxDate >= 0 ? cols[idxDate].trim() : '';
    const acqTime = idxTime >= 0 ? cols[idxTime].trim().padStart(4, '0') : '';

    detections.push({
      id: `firms-${acqDate}-${acqTime}-${lat.toFixed(3)}-${lon.toFixed(3)}-${i}`,
      lat,
      lon,
      brightTi4,
      acqDate,
      acqTime,
      confidence: confRaw || 'nominal',
      frp,
      distanceKm: Number(distanceKm.toFixed(2)),
      bearingDeg: Number(bearingDeg.toFixed(1)),
      bearingCardinal,
    });
  }

  detections.sort((a, b) => a.distanceKm - b.distanceKm);
  return detections;
}

export async function fetchFirmsDetections(
  lat: number,
  lon: number,
  radiusKm: RadiusKm,
  forceRefresh = false
): Promise<SourceEnvelope<FirmsPayload>> {
  const apiKey = resolveFirmsApiKey();
  const cacheKey = `firms:${lat.toFixed(2)},${lon.toFixed(2)}:${radiusKm}:${apiKey ? 'keyed' : 'nokey'}`;

  if (!apiKey) {
    return {
      data: {
        detections: [],
        hasApiKey: false,
        fallbackMode: true,
      },
      fetchedAt: Date.now(),
      observationDate: new Date().toISOString().slice(0, 10),
      stale: false,
      error: null,
      fromCache: false,
      sourceNote:
        'Using NASA EONET + GIBS Thermal layer (add optional FIRMS key in Methods for 375m CSV points)',
    };
  }

  if (!forceRefresh) {
    const cached = getCached<FirmsPayload>(cacheKey, TTL_MS.FIRMS);
    if (cached) {
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

  const [west, south, east, north] = boundingBox(lat, lon, radiusKm);
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(
    apiKey
  )}/VIIRS_SNPP_NRT/${west},${south},${east},${north}/2`;

  try {
    const csvText = await fetchText(url);
    // FIRMS returns plain-text error messages if key is invalid
    if (csvText.toLowerCase().includes('invalid map_key') || !csvText.includes(',')) {
      throw new Error('Invalid FIRMS MAP_KEY or empty CSV response');
    }

    const detections = parseFirmsCsv(csvText, lat, lon, radiusKm);
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
    if (expired) {
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
        hasApiKey: true,
        fallbackMode: true,
      },
      fetchedAt: Date.now(),
      observationDate: new Date().toISOString().slice(0, 10),
      stale: false,
      error: null,
      fromCache: false,
      sourceNote:
        err instanceof Error
          ? `Using NASA EONET + GIBS Thermal layer (FIRMS CSV fallback: ${err.message})`
          : 'Using NASA EONET + GIBS Thermal layer',
    };
  }
}
