/**
 * NEXORA Unified API Base URL Resolver
 * 
 * In production (Vercel or custom domain), API routes are served on the same origin under `/api`.
 * In local development, requests to `/api` are automatically proxied to the Express backend on port 5001 by Vite.
 * If running in a remote browser environment, this helper guarantees that `http://localhost` is never called.
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';

    // If running in production or on any remote deployed domain, ALWAYS use same-origin relative `/api`
    if (!isLocal) {
      return '/api';
    }
  }

  const configured = import.meta.env.VITE_API_BASE_URL;
  if (!configured || configured.trim() === '' || configured.trim() === '/') {
    return '/api';
  }

  // If configured points to localhost but the app is not running locally, fallback to `/api`
  if (typeof window !== 'undefined' && configured.includes('localhost') && window.location.hostname !== 'localhost') {
    return '/api';
  }

  return configured.trim().replace(/\/+$/, '');
};
