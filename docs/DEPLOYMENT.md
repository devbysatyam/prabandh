# Deployment Guide — Prabandh · प्रबंध

Prabandh is designed to deploy seamlessly to Vercel, Netlify, or any static host with Node.js serverless functions.

---

## 1. Quick Deploy to Vercel

1. Link or import the GitHub repository [`devbysatyam/prabandh`](https://github.com/devbysatyam/prabandh) in the Vercel Dashboard.
2. Select the **Vite** preset (root directory `./`).
3. Add environment variables:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```
4. Click **Deploy**. Vercel will automatically compile the frontend assets to `dist/` and route API calls to `/api/*.ts`.

---

## 2. Local Production Build

To test the optimized production build locally:

```bash
npm run build
npm run preview
```

---

## 3. Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Optional | Built-in fallback | Google Gemini API key for live language parsing & copilot |
| `GEMINI_MODEL` | Optional | `gemini-3.5-flash-lite` | Gemini model name |
| `VITE_GEMINI_API_KEY` | Optional | - | Optional client-side key for client-directed calls |
