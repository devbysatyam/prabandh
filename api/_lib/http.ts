import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  ERRORS,
  MAX_BODY_BYTES,
  isAllowedOrigin,
  isJsonContentType,
  rateLimit,
} from '../../src/api/security';

export { MAX_BODY_BYTES };

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export function json(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.end(JSON.stringify(data));
}

/** Read and strictly parse a JSON object body, enforcing a byte cap. Throws HttpError. */
export async function readBody<T = Record<string, unknown>>(
  req: IncomingMessage,
  maxBytes: number = MAX_BODY_BYTES,
): Promise<T> {
  const declared = Number(req.headers['content-length'] ?? 0);
  if (declared > maxBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE');
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    req.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      received += buf.length;
      if (received > maxBytes) {
        req.destroy();
        reject(new HttpError(413, 'PAYLOAD_TOO_LARGE'));
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body.trim()) return resolve({} as T);
      try {
        const parsed: unknown = JSON.parse(body);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return reject(new HttpError(400, 'INVALID_REQUEST'));
        }
        resolve(parsed as T);
      } catch {
        reject(new HttpError(400, 'INVALID_REQUEST'));
      }
    });
    req.on('error', () => reject(new HttpError(400, 'INVALID_REQUEST')));
  });
}

function clientKey(req: IncomingMessage): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

type Handler = (
  route: string,
  body: unknown,
  method: string,
) => Promise<{ status: number; data: unknown }>;

/** Builds a hardened serverless handler: POST-only, same-origin, JSON-only, rate-limited, size-capped. */
export function createRoute(route: string, handle: Handler) {
  return async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return json(res, ERRORS.method.status, ERRORS.method.data);
      }
      const h = req.headers;
      if (!isAllowedOrigin(h.origin, h.host)) {
        return json(res, ERRORS.forbidden.status, ERRORS.forbidden.data);
      }
      if (!isJsonContentType(h['content-type'])) {
        return json(res, ERRORS.unsupported.status, ERRORS.unsupported.data);
      }
      if (!rateLimit(`${route}:${clientKey(req)}`)) {
        res.setHeader('Retry-After', '60');
        return json(res, ERRORS.rate.status, ERRORS.rate.data);
      }
      const body = await readBody(req);
      const result = await handle(route, body, 'POST');
      json(res, result.status, result.data);
    } catch (err) {
      if (err instanceof HttpError) return json(res, err.status, { error: err.code });
      console.error(`[api/${route}] unhandled`);
      json(res, ERRORS.internal.status, ERRORS.internal.data);
    }
  };
}
