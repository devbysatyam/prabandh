import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

const DEV_MAX_BODY_BYTES = 256 * 1024;

interface ApiResult {
  status: number;
  data: unknown;
}
type ApiHandler = (route: string, body: unknown, method: string) => Promise<ApiResult>;

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

/** Collect the request body as text; resolves null if it exceeds the byte cap. */
function collectBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    let raw = '';
    let tooLarge = false;
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk.toString();
      if (raw.length > DEV_MAX_BODY_BYTES) {
        tooLarge = true;
        req.destroy();
      }
    });
    req.on('end', () => resolve(tooLarge ? null : raw));
  });
}

async function handleDevApi(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  const route = (req.url ?? '').replace(/^\/api\//, '').split('?')[0] ?? '';
  const rawBody = await collectBody(req);
  if (rawBody === null) return sendJson(res, 413, { error: 'PAYLOAD_TOO_LARGE' });

  let body: unknown = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return sendJson(res, 400, { error: 'INVALID_REQUEST' });
    }
  }

  try {
    const apiMod = (await server.ssrLoadModule('/src/api/handler.ts')) as {
      handleApiRequest?: ApiHandler;
    };
    if (typeof apiMod.handleApiRequest === 'function') {
      const result = await apiMod.handleApiRequest(route, body, req.method ?? 'POST');
      return sendJson(res, result.status, result.data);
    }
  } catch {
    return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
  }
  return sendJson(res, 404, { error: 'ROUTE_NOT_FOUND' });
}

/** Serves `/api/*` through the shared handler during `vite dev`. */
function devApiMiddleware(): Plugin {
  return {
    name: 'promptwars-api-middleware',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!(req.url ?? '').startsWith('/api/')) return next();
        void handleDevApi(server, req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (!process.env.GEMINI_MODEL && env.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  }

  return {
    plugins: [react(), devApiMiddleware()],
    build: {
      target: 'es2022',
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/engine/**/*.ts'],
        thresholds: { statements: 95, lines: 95, functions: 95, branches: 90 },
      },
    },
  };
});
