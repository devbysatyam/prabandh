import { GoogleGenAI } from '@google/genai';

// Server-side only. No hard-coded fallback: without GEMINI_API_KEY the API uses its deterministic engine.
const API_KEY = process.env.GEMINI_API_KEY;
export const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

let client: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!client) {
    try {
      client = new GoogleGenAI({ apiKey: API_KEY });
    } catch {
      return null;
    }
  }
  return client;
}
