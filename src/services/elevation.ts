import { getCached, setCached } from '../utils/cache';
import { fetchJson } from './http';

export interface ElevationGrid {
  size: number; // 9 (9x9 = 81 samples)
  elevations: number[]; // row-major [row * size + col], North->South, West->East
  minElevM: number;
  maxElevM: number;
  centerElevM: number;
  spanKm: number;
}

const ELEVATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchDemElevationGrid(
  lat: number,
  lon: number,
  radiusKm: number
): Promise<ElevationGrid | null> {
  const size = 9;
  const spanKm = Math.min(40, Math.max(12, radiusKm * 0.5));
  const cacheKey = `dem:${lat.toFixed(2)},${lon.toFixed(2)}:${spanKm}`;
  const cached = getCached<ElevationGrid>(cacheKey, ELEVATION_TTL_MS);
  if (cached) {
    return cached.data;
  }

  const latSpanDeg = spanKm / 111.0;
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const lonSpanDeg = spanKm / (111.32 * cosLat);

  const lats: string[] = [];
  const lons: string[] = [];

  // North (-Z in Three.js) to South (+Z in Three.js), West (-X) to East (+X)
  for (let r = 0; r < size; r++) {
    const tZ = (r / (size - 1)) * 2 - 1; // -1 (North) .. +1 (South)
    const ptLat = Math.max(-89.9, Math.min(89.9, lat - tZ * latSpanDeg));
    for (let c = 0; c < size; c++) {
      const tX = (c / (size - 1)) * 2 - 1; // -1 (West) .. +1 (East)
      const ptLon = ((((lon + tX * lonSpanDeg) + 180) % 360) + 360) % 360 - 180;
      lats.push(ptLat.toFixed(4));
      lons.push(ptLon.toFixed(4));
    }
  }

  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lons.join(',')}`;

  try {
    const res = await fetchJson<{ elevation?: number[] }>(url, 9000);
    if (!Array.isArray(res.elevation) || res.elevation.length !== size * size) {
      return null;
    }

    const elevations = res.elevation.map((v) => (Number.isFinite(v) ? v : 0));
    let minElevM = Infinity;
    let maxElevM = -Infinity;
    for (const e of elevations) {
      if (e < minElevM) minElevM = e;
      if (e > maxElevM) maxElevM = e;
    }
    const centerElevM = elevations[Math.floor((size * size) / 2)] ?? minElevM;

    const grid: ElevationGrid = {
      size,
      elevations,
      minElevM: Math.round(minElevM),
      maxElevM: Math.round(maxElevM),
      centerElevM: Math.round(centerElevM),
      spanKm,
    };
    setCached(cacheKey, grid);
    return grid;
  } catch {
    return null;
  }
}

/**
 * Creates a bilinearly interpolated Three.js terrain height sampler from real Copernicus DEM meters.
 * Maps scene coordinates (x, z in [-36, 36]) onto the 9x9 DEM grid, gently carving the central
 * watershed channel while preserving real mountain relief and ridges.
 */
export function makeDemHeightSampler(grid: ElevationGrid): (x: number, z: number) => number {
  const { size, elevations, minElevM, maxElevM } = grid;
  const reliefM = Math.max(25, maxElevM - minElevM);
  // Scale real vertical relief gracefully to 0..7.5 scene units without exaggerating flat plains
  const verticalScale = Math.min(7.5 / reliefM, 0.045);

  const sampleRaw = (x: number, z: number): number => {
    const u = Math.max(0, Math.min(1, (x + 36) / 72)) * (size - 1);
    const v = Math.max(0, Math.min(1, (z + 36) / 72)) * (size - 1);

    const c0 = Math.floor(u);
    const r0 = Math.floor(v);
    const c1 = Math.min(size - 1, c0 + 1);
    const r1 = Math.min(size - 1, r0 + 1);

    const fx = u - c0;
    const fz = v - r0;

    const e00 = elevations[r0 * size + c0];
    const e10 = elevations[r0 * size + c1];
    const e01 = elevations[r1 * size + c0];
    const e11 = elevations[r1 * size + c1];

    const top = e00 + (e10 - e00) * fx;
    const bot = e01 + (e11 - e01) * fx;
    const elevM = top + (bot - top) * fz;

    return (elevM - minElevM) * verticalScale;
  };

  const centerBase = sampleRaw(0, 0);

  return function groundHeightAt(x: number, z: number): number {
    const base = sampleRaw(x, z);
    const distFromOrigin = Math.sqrt(x * x + z * z);

    // Subtle hydrological river trough along local low corridor offset from station
    const riverCenterX = Math.sin(z * 0.12) * 4.5 + 5.2;
    const riverDist = Math.abs(x - riverCenterX);
    const channelCarve = Math.exp(-(riverDist * riverDist) / 12.0) * 1.15;

    // Smooth immediate 2.5m station bench so telemetry pad sits flush
    const padFlatten = Math.exp(-(distFromOrigin * distFromOrigin) / 7.5);
    const stationLevel = Math.max(0.45, centerBase);

    const h = base - channelCarve;
    return h * (1 - padFlatten * 0.85) + stationLevel * padFlatten * 0.85;
  };
}
