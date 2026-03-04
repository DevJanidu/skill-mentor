import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// ---------------------------------------------------------------------------
// Axios instance – points at the Spring Boot backend
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// The Clerk JWT template name configured in the Clerk Dashboard.
// The backend audience claim must match this value.
// ---------------------------------------------------------------------------
const CLERK_JWT_TEMPLATE = "skill-mentor";

// ---------------------------------------------------------------------------
// Auth interceptor – attaches the Clerk JWT automatically
// ---------------------------------------------------------------------------
let _getToken:
  | ((opts?: { template?: string }) => Promise<string | null>)
  | null = null;

/** Call once from <App /> to wire getToken from Clerk's useAuth() */
export function setAuthTokenGetter(
  fn: (opts?: { template?: string }) => Promise<string | null>,
) {
  _getToken = fn;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (_getToken) {
    // Always request the custom JWT template that includes roles + profile claims
    const token = await _getToken({ template: CLERK_JWT_TEMPLATE });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------
export interface ApiErrorBody {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  timestamp?: string;
  path?: string;
}

export function extractErrorMessage(error: unknown): string {
  const axiosErr = error as AxiosError<ApiErrorBody>;
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
  if (axiosErr.message) return axiosErr.message;
  return "An unexpected error occurred";
}

export default api;
