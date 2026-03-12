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
export const CLERK_JWT_TEMPLATE = "skill-mentor";

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

/**
 * Returns a user-facing error string from an Axios error.
 * Includes field-level validation messages when the backend returns them.
 * Maps HTTP status codes to friendly descriptions when the backend message is too technical.
 */
export function extractErrorMessage(error: unknown): string {
  const axiosErr = error as AxiosError<ApiErrorBody>;
  if (axiosErr.response?.data) {
    const data = axiosErr.response.data;
    if (data.errors && Object.keys(data.errors).length > 0) {
      const fieldMessages = Object.values(data.errors).join("; ");
      return data.message ? `${data.message}: ${fieldMessages}` : fieldMessages;
    }
    if (data.message) return data.message;
  }

  // Fallback: friendly messages by HTTP status when no backend message available
  const status = axiosErr.response?.status;
  if (status === 409)
    return "Cannot complete this action because the record is linked to other data. Remove related records first.";
  if (status === 403)
    return "You don't have permission to perform this action.";
  if (status === 404) return "The requested record was not found.";
  if (status === 400)
    return "The request was invalid. Please check your input.";
  if (status && status >= 500)
    return "Something went wrong on the server. Please try again later.";

  if (axiosErr.message) return axiosErr.message;
  return "An unexpected error occurred";
}

/**
 * Returns the field→message map from a validation error response,
 * useful for setting per-field error state in forms.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const axiosErr = error as AxiosError<ApiErrorBody>;
  return axiosErr?.response?.data?.errors ?? {};
}

export default api;
