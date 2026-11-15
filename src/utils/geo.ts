const EARTH_RADIUS_KM = 6371;

const COMPASS_16 = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
] as const;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Exact Haversine distance in kilometers (R = 6371 km).
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const a = sinDLat * sinDLat + Math.cos(phi1) * Math.cos(phi2) * sinDLon * sinDLon;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Initial forward compass bearing from (lat1, lon1) to (lat2, lon2) in degrees [0, 360).
 */
export function forwardBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lon2 - lon1);

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

/**
 * Maps compass bearing degrees to 16-point cardinal direction.
 */
export function bearingTo16Point(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_16[index];
}

/**
 * Computes [west, south, east, north] bounding box for a given center and radius in km.
 */
export function boundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): [number, number, number, number] {
  const latDelta = toDeg(radiusKm / EARTH_RADIUS_KM);
  const cosLat = Math.max(0.05, Math.cos(toRad(lat)));
  const lonDelta = toDeg(radiusKm / (EARTH_RADIUS_KM * cosLat));

  const south = Math.max(-89.9, lat - latDelta);
  const north = Math.min(89.9, lat + latDelta);
  const west = Math.max(-180, lon - lonDelta);
  const east = Math.min(180, lon + lonDelta);

  return [
    Number(west.toFixed(4)),
    Number(south.toFixed(4)),
    Number(east.toFixed(4)),
    Number(north.toFixed(4)),
  ];
}

/**
 * Checks whether coordinates fall inside Pakistan bounding region for Rescue 1122 footer guidance.
 */
export function isInsidePakistan(lat: number, lon: number): boolean {
  return lat >= 23.5 && lat <= 37.2 && lon >= 60.8 && lon <= 77.8;
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}
