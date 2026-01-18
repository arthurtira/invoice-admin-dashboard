"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/app/context/auth-context"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  requireAdmin?: boolean
}

export function AuthLayout({ children, title, requireAdmin = false }: AuthLayoutProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (requireAdmin && !isAdmin) {
        router.push("/")
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}
