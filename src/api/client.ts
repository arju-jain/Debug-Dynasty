import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAnonymousSessionId } from '../utils/trialManager';

// Base URL strictly read from Vite environment variable; defaults to empty string for relative single-URL setup
// Strips trailing slashes and trailing '/api' to guarantee endpoints like '/api/health' compose cleanly without duplication
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
export const API_BASE_URL: string = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export class ApiClientError extends Error {
  statusCode: number;
  details?: unknown;
  isNetworkError: boolean;

  constructor(message: string, statusCode: number = 500, details?: unknown, isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

// Format FastAPI validation errors or standard HTTP errors into clean readable strings
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        // FastAPI validation errors (422)
        return data.detail
          .map((item: { loc?: string[]; msg?: string }) => {
            const field = item.loc ? item.loc.slice(1).join('.') : 'field';
            return `${field}: ${item.msg || 'invalid value'}`;
          })
          .join('; ');
      }
      if (typeof data.message === 'string') {
        return data.message;
      }
      if (typeof data.error === 'string') {
        return data.error;
      }
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'The request timed out. The backend or code sandbox took too long to respond.';
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      const location = API_BASE_URL ? ` at ${API_BASE_URL}` : '';
      return `Unable to reach backend server${location}. Ensure the FastAPI server is running.`;
    }

    switch (error.response?.status) {
      case 400:
        return 'Bad Request: The submitted payload is missing required fields or has an invalid structure.';
      case 401:
        return 'Unauthorized: Authentication required to access this endpoint.';
      case 403:
        return 'Forbidden: Access to this debugging resource was denied.';
      case 404:
        return 'Not Found: The requested endpoint or session does not exist.';
      case 413:
        return 'Payload Too Large: The submitted code snippet exceeds the maximum permitted size.';
      case 422:
        return 'Unprocessable Entity: Validation failed on the input parameters.';
      case 429:
        return 'Too Many Requests: Rate limit exceeded. Please wait a moment before trying again.';
      case 500:
        return 'Internal Server Error: The backend encountered an unexpected error.';
      case 502:
      case 503:
      case 504:
        return 'Backend Service Unavailable: Sandbox or AI provider is currently unreachable.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred.';
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s timeout for AI analysis and test execution
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Attach persistent anonymous session identifier
    if (typeof window !== 'undefined') {
      const sessionId = getAnonymousSessionId();
      if (sessionId) {
        config.headers['X-Anonymous-Session-Id'] = sessionId;
      }
      const token = localStorage.getItem('debugdynasty_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const isNetwork = !error.response || error.code === 'ERR_NETWORK';
    const status = error.response?.status || (isNetwork ? 0 : 500);
    const message = extractErrorMessage(error);
    return Promise.reject(new ApiClientError(message, status, error.response?.data, isNetwork));
  }
);

export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },
};

export default apiClient;
