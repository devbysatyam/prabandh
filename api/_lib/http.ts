import type { IncomingMessage, ServerResponse } from 'node:http';

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB limit to prevent buffer exhaustion / DoS

export function json(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.end(JSON.stringify(data));
}

export async function readBody<T = Record<string, unknown>>(
  req: IncomingMessage,
  maxBytes: number = MAX_BODY_BYTES,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesReceived = 0;

    req.on('data', (chunk: Buffer | string) => {
      bytesReceived += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
      if (bytesReceived > maxBytes) {
        req.destroy();
        reject(new Error('Payload Too Large: Exceeded 1MB limit'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(body) as T);
      } catch {
        resolve({ text: body } as T);
      }
    });

    req.on('error', reject);
  });
}
