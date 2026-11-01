import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LIufQvKwMF095_XCTc99rv8tcAf29WmNIxgGY73Vw5oA';
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
