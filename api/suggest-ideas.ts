import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../src/api/handler';
import { json, readBody } from './_lib/http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method Not Allowed' });
    return;
  }
  const body = await readBody(req);
  const result = await handleApiRequest('suggest-ideas', body, 'POST');
  json(res, result.status, result.data);
}
