import type { GeoLocation } from '../types/telemetry';
import { fetchJson } from './http';

interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingResult[];
}

export async function searchPlaces(query: string): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=5&language=en&format=json`;

  const data = await fetchJson<OpenMeteoGeocodingResponse>(url);
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((item) => ({
    name: item.name,
    admin1: item.admin1,
    country: item.country,
    lat: Number(item.latitude.toFixed(4)),
    lon: Number(item.longitude.toFixed(4)),
    timezone: item.timezone || 'UTC',
  }));
}
