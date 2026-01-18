"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { DecodedToken } from "@/app/types"

const TOKEN_STORAGE_KEY = "auth_token"
const USER_TYPE_STORAGE_KEY = "auth_user_type"

function decodeJwt(token: string): DecodedToken | null {
  const parts = token.split(".")
  if (parts.length < 2) {
    return null
  }

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded) as DecodedToken
  } catch {
    return null
  }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUserType = localStorage.getItem(USER_TYPE_STORAGE_KEY)

    if (storedToken) {
      const decoded = decodeJwt(storedToken)
      if (decoded) {
        setToken(storedToken)
        setUser(decoded)
        setUserType(storedUserType)
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    }

    if (!storedToken && storedUserType) {
      localStorage.removeItem(USER_TYPE_STORAGE_KEY)
    }

    setIsLoading(false)
  }, [])

  const login = useCallback((jwtToken: string, type?: string | null) => {
    const decoded = decodeJwt(jwtToken)
    if (!decoded) {
      return false
    }

    setToken(jwtToken)
    setUser(decoded)
    setUserType(type ?? null)
    localStorage.setItem(TOKEN_STORAGE_KEY, jwtToken)

    if (type) {
      localStorage.setItem(USER_TYPE_STORAGE_KEY, type)
    } else {
      localStorage.removeItem(USER_TYPE_STORAGE_KEY)
    }

    return true
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setUserType(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_TYPE_STORAGE_KEY)
  }, [])

  const isAdmin = useMemo(() => {
    if (userType?.toLowerCase() === "admin") {
      return true
    }
    return Boolean(user?.roles?.some((role) => role.toLowerCase().includes("admin")))
  }, [user, userType])

  return {
    token,
    user,
    userType,
    isLoading,
    isAuthenticated: Boolean(token && user),
    isAdmin,
    login,
    logout,
  }
}
