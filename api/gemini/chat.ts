import { processChatRequest } from '../../server/geminiCore';

interface VercelReq {
  method?: string;
  body?: unknown;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (payload: unknown) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let parsedBody = req.body;
  if (typeof parsedBody === 'string') {
    try {
      parsedBody = JSON.parse(parsedBody);
    } catch {
      res.status(400).json({ error: 'Invalid JSON request body' });
      return;
    }
  }

  const result = await processChatRequest(parsedBody);
  res.status(result.status).json(result.body);
}
