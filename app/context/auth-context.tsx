"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@/app/hooks/use-auth"
import type { DecodedToken } from "@/app/types"

interface AuthContextType {
  token: string | null
  user: DecodedToken | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (token: string, userType?: string | null) => boolean
  logout: () => void
  userType: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
