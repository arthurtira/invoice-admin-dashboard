"use client"

import { useState, useEffect, useCallback } from "react"
import type { DecodedToken } from "@/app/types"

function decodeJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
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
    const storedToken = localStorage.getItem("auth_token")
    const storedUserType = localStorage.getItem("auth_user_type")
    if (storedToken) {
      const decoded = decodeJwt(storedToken)
      if (decoded) {
        setToken(storedToken)
        setUser(decoded)
        setUserType(storedUserType)
      } else {
        localStorage.removeItem("auth_token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((newToken: string, newUserType?: string | null): boolean => {
    const decoded = decodeJwt(newToken)
    if (decoded) {
      localStorage.setItem("auth_token", newToken)
      if (newUserType) {
        localStorage.setItem("auth_user_type", newUserType)
      }
      setToken(newToken)
      setUser(decoded)
      setUserType(newUserType ?? null)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user_type")
    setToken(null)
    setUser(null)
    setUserType(null)
  }, [])

  const isAdmin = user?.roles?.includes("ADMIN") ?? false

  return {
    token,
    user,
    isLoading,
    isAuthenticated: !!token,
    isAdmin,
    login,
    logout,
    userType,
  }
}
