import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy /api/* to a local function runner OR to your deployed Vercel preview.
// In production on Vercel, /api/* is handled by serverless functions automatically.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // To test the API proxy locally, run `vercel dev` instead of `npm run dev`,
    // or proxy requests to your deployed Vercel preview URL here.
  },
});
