import type { EonetEvent, SourceEnvelope } from '../types/telemetry';
import { getCached, setCached, TTL_MS } from '../utils/cache';
import { bearingTo16Point, forwardBearingDeg, haversineKm } from '../utils/geo';
import { fetchJson } from './http';

interface EonetGeometry {
  date: string;
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][][];
}

interface EonetRawEvent {
  id: string;
  title: string;
  categories: { id: string; title: string }[];
  sources?: { id: string; url: string }[];
  geometry: EonetGeometry[];
}

interface EonetResponse {
  events: EonetRawEvent[];
}

const MAX_EONET_DISTANCE_KM = 400;

function extractLatLon(geom: EonetGeometry): { lat: number; lon: number } | null {
  if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
    const lon = Number(geom.coordinates[0]);
    const lat = Number(geom.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
  }
  if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
    const ring = (geom.coordinates as number[][][])[0];
    if (Array.isArray(ring) && ring.length > 0) {
      let sumLon = 0;
      let sumLat = 0;
      let count = 0;
      for (const pt of ring) {
        if (Array.isArray(pt) && pt.length >= 2) {
          sumLon += Number(pt[0]);
          sumLat += Number(pt[1]);
          count++;
        }
      }
      if (count > 0) {
        return { lat: sumLat / count, lon: sumLon / count };
      }
    }
  }
  return null;
}

export async function fetchEonetEvents(
  lat: number,
  lon: number,
  forceRefresh = false
): Promise<SourceEnvelope<EonetEvent[]>> {
  const globalCacheKey = 'eonet:global:open';
  let rawEvents: EonetRawEvent[] | null = null;
  let timestamp = Date.now();
  let fromCache = false;
  let stale = false;

  if (!forceRefresh) {
    const cached = getCached<EonetRawEvent[]>(globalCacheKey, TTL_MS.EONET);
    if (cached) {
      rawEvents = cached.data;
      timestamp = cached.timestamp;
      fromCache = true;
      stale = cached.stale;
    }
  }

  if (!rawEvents) {
    const url =
      'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires,floods,severeStorms,landslides';
    try {
      const res = await fetchJson<EonetResponse>(url);
      rawEvents = Array.isArray(res.events) ? res.events : [];
      timestamp = setCached(globalCacheKey, rawEvents);
      fromCache = false;
      stale = false;
    } catch (err) {
      const expired = getCached<EonetRawEvent[]>(globalCacheKey, TTL_MS.EONET, true);
      if (expired) {
        rawEvents = expired.data;
        timestamp = expired.timestamp;
        fromCache = true;
        stale = true;
      } else {
        return {
          data: null,
          fetchedAt: null,
          observationDate: null,
          stale: false,
          error: err instanceof Error ? err.message : 'NASA EONET unavailable',
          fromCache: false,
        };
      }
    }
  }

  const nearby: EonetEvent[] = [];
  for (const ev of rawEvents) {
    if (!ev.geometry || ev.geometry.length === 0) continue;
    const latestGeom = ev.geometry[ev.geometry.length - 1];
    const coords = extractLatLon(latestGeom);
    if (!coords) continue;

    const distanceKm = haversineKm(lat, lon, coords.lat, coords.lon);
    if (distanceKm > MAX_EONET_DISTANCE_KM) continue;

    const bearingDeg = forwardBearingDeg(lat, lon, coords.lat, coords.lon);
    const cat = ev.categories?.[0] || { id: 'wildfires', title: 'Natural Event' };

    nearby.push({
      id: ev.id,
      title: ev.title,
      categoryId: cat.id,
      categoryTitle: cat.title,
      date: latestGeom.date,
      lat: coords.lat,
      lon: coords.lon,
      distanceKm: Number(distanceKm.toFixed(1)),
      bearingDeg: Number(bearingDeg.toFixed(1)),
      bearingCardinal: bearingTo16Point(bearingDeg),
      sourceUrl: ev.sources?.[0]?.url,
    });
  }

  nearby.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    data: nearby,
    fetchedAt: timestamp,
    observationDate: nearby[0]?.date?.slice(0, 10) || new Date(timestamp).toISOString().slice(0, 10),
    stale,
    error: null,
    fromCache,
  };
}
