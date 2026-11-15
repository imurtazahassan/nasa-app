import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { processBriefRequest, processChatRequest } from './server/geminiCore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/gemini/brief', async (req, res) => {
    const result = await processBriefRequest(req.body);
    res.status(result.status).json(result.body);
  });

  app.post('/api/gemini/chat', async (req, res) => {
    const result = await processChatRequest(req.body);
    res.status(result.status).json(result.body);
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EarthPulse server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
