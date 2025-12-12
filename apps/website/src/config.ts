// Centralized runtime config for the frontend
// Use Vite environment variable VITE_API_BASE to override in development/production
// access import.meta.env safely without TypeScript errors
export const API_ROOT: string = import.meta.env.VITE_API_URL

export default {
  API_ROOT,
};
