import { processFirmsProxyRequest } from '../server/firmsCore';
import type { RadiusKm } from '../src/types/telemetry';

interface VercelReq {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (payload: unknown) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const lat = Number.parseFloat(String(req.query?.lat ?? ''));
  const lon = Number.parseFloat(String(req.query?.lon ?? ''));
  const rRaw = Number.parseInt(String(req.query?.radiusKm ?? '50'), 10);
  const radiusKm: RadiusKm = rRaw === 25 || rRaw === 100 ? rRaw : 50;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'Invalid lat/lon coordinates' });
    return;
  }

  const headerKey = req.headers?.['x-firms-key'];
  const userKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;

  const result = await processFirmsProxyRequest({ lat, lon, radiusKm, userKey });
  res.status(result.status).json(result.body);
}
