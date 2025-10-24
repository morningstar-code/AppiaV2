// Use environment variable or fallback to production API
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// Use relative API URL to always match current deployment
export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const IS_PRODUCTION = import.meta.env.PROD; 