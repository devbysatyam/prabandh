import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

function devApiMiddleware() {
  return {
    name: 'promptwars-api-middleware',
    apply: 'serve' as const,
    configureServer(server: any) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) {
          return next();
        }

        const route = url.replace(/^\/api\//, '').split('?')[0];
        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
        });

        req.on('end', async () => {
          let body: any = {};
          if (rawBody) {
            try {
              body = JSON.parse(rawBody);
            } catch {
              body = { text: rawBody };
            }
          }

          try {
            const apiMod = await server.ssrLoadModule('/src/api/handler.ts');
            const handler = apiMod.handleApiRequest;
            if (typeof handler === 'function') {
              const result = await handler(route, body, req.method ?? 'POST');
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.data));
              return;
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'INTERNAL_SERVER_ERROR' }));
            return;
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'ROUTE_NOT_FOUND' }));
        });
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
      },
    },
  };
});
