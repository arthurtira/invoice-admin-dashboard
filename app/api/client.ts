import axios, { type AxiosInstance, type AxiosError } from "axios"

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "/api"

function normalizeApiBase(rawBaseUrl: string) {
  const normalized = rawBaseUrl.replace(/\/$/, "")

  if (normalized.endsWith("/api/v1")) {
    const rootBase = normalized.slice(0, -"/api/v1".length) || ""
    return {
      rootBase,
      apiBase: normalized.slice(0, -"/v1".length),
      v1Base: normalized,
    }
  }

  if (normalized.endsWith("/api")) {
    const rootBase = normalized.slice(0, -"/api".length) || ""
    return {
      rootBase,
      apiBase: normalized,
      v1Base: `${normalized}/v1`,
    }
  }

  return {
    rootBase: normalized,
    apiBase: `${normalized}/api`,
    v1Base: `${normalized}/api/v1`,
  }
}

const DEFAULT_BASE = normalizeApiBase(RAW_API_BASE_URL)
export const API_V1_BASE_URL = DEFAULT_BASE.v1Base

export function getConfiguredApiBase() {
  if (typeof window === "undefined") {
    return DEFAULT_BASE
  }
  const stored = localStorage.getItem("api_base_url")
  if (stored) {
    const isAbsolute = /^https?:\/\//i.test(stored)
    if (isAbsolute && !stored.startsWith(window.location.origin)) {
      return normalizeApiBase("/api")
    }
    return normalizeApiBase(stored)
  }
  return DEFAULT_BASE
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_V1_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const configured = getConfiguredApiBase()
      config.baseURL = configured.v1Base
      const token = localStorage.getItem("auth_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = (error.response?.data as { message?: string } | undefined)?.message || error.message
    return status ? `${message} (HTTP ${status})` : message
  }
  return "Unexpected error"
}

export default apiClient
