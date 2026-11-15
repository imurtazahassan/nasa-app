import type { FirmsDetection, RadiusKm } from '../src/types/telemetry';
import { bearingTo16Point, boundingBox, forwardBearingDeg, haversineKm } from '../src/utils/geo';

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

export async function processFirmsProxyRequest(params: {
  lat: number;
  lon: number;
  radiusKm: RadiusKm;
  userKey?: string;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const { lat, lon, radiusKm, userKey } = params;
  const serverKey = (process.env.FIRMS_MAP_KEY || process.env.NASA_FIRMS_KEY || '').trim();
  const effectiveKey = (userKey || '').trim() || serverKey;

  if (!effectiveKey) {
    return {
      status: 200,
      body: {
        detections: [],
        hasApiKey: false,
        fallbackMode: true,
      },
    };
  }

  const [west, south, east, north] = boundingBox(lat, lon, radiusKm);
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(
    effectiveKey
  )}/VIIRS_SNPP_NRT/${west},${south},${east},${north}/2`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 11000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const csvText = await res.text();
    if (csvText.toLowerCase().includes('invalid map_key') || !csvText.includes(',')) {
      throw new Error('Invalid FIRMS MAP_KEY or empty CSV response');
    }

    const detections = parseFirmsCsv(csvText, lat, lon, radiusKm);
    return {
      status: 200,
      body: {
        detections,
        hasApiKey: true,
        fallbackMode: false,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'FIRMS proxy request failed';
    return {
      status: 502,
      body: {
        error: message,
        detections: [],
        hasApiKey: true,
        fallbackMode: true,
      },
    };
  }
}
