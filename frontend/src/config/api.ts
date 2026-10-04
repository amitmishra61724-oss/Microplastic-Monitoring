/**
 * Microplastic Monitoring API Configuration
 * 
 * Supports dynamic configuration via Vite environment variables:
 * - VITE_API_URL: Base URL of the backend API (e.g. 'https://microplastic-backend.onrender.com')
 * Falls back to 'http://localhost:8000' during local development.
 */

const envApiUrl = import.meta.env.VITE_API_URL;

// Base API URL without trailing slash
export const API_BASE_URL: string = (envApiUrl && envApiUrl.trim() !== ''
  ? envApiUrl.trim()
  : 'http://localhost:8000'
).replace(/\/+$/, '');

/**
 * Build a full URL for an API endpoint
 * @param path Endpoint path, e.g. '/api/v1/samples'
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Build a full URL for static assets (images, reports)
 * Handles both relative backend paths ('/static/uploads/...') and already fully-qualified URLs
 */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
