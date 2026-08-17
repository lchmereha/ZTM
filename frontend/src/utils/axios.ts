import axios, { AxiosError } from 'axios';

const axiosServices = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true // Send httpOnly cookies with every request
});

// ── Custom error class for API errors ────────────────────────
class ApiError extends Error {
  readonly status?: number;
  readonly detalhes?: { campo: string; erros: string[]; index?: number }[];
  readonly _requestPayload?: unknown;
  [key: string]: unknown;

  constructor(data: Record<string, unknown>, status?: number, requestPayload?: unknown) {
    super((data.message as string) || 'Algo deu errado');
    this.name = 'ApiError';
    this.status = status;
    this._requestPayload = requestPayload;

    // Copy all server-provided fields (titulo, detalhes, etc.)
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'message') {
        (this as Record<string, unknown>)[key] = value;
      }
    }
  }
}

// ── Response interceptor ─────────────────────────────────────
axiosServices.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Record<string, unknown>>) => {
    if (error.response?.status === 401) {
      // Allow login failures to pass through so the login UI can display the error
      if (error.config && !error.config.url?.includes('/auth/login')) {
        // Clear local user data (cookie is managed by the server)
        window.localStorage.removeItem('user');
        window.sessionStorage.removeItem('user');
        window.localStorage.removeItem('activeFilial');
        window.sessionStorage.removeItem('activeFilial');
        window.sessionStorage.setItem('session_expired', 'true');
        window.location.href = (import.meta.env.VITE_APP_BASE_NAME || '') + '/session-expired';
        return new Promise(() => {}); // Stop promise chain
      }
    }

    const data = (error.response?.data as Record<string, unknown>) || { message: 'Algo deu errado' };
    return Promise.reject(new ApiError(data, error.response?.status, error.config?.data));
  }
);

export default axiosServices;
