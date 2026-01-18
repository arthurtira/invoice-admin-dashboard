"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthContext } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { formatDateTime } from "@/lib/format"

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const { user, token, userType, logout } = useAuthContext()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const tokenExpiresAt = user?.exp ? new Date(user.exp * 1000) : null
  const tokenExpired = tokenExpiresAt ? tokenExpiresAt.getTime() < Date.now() : false

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

      <div className="flex items-center gap-4">
        {user && (
          <>
            {userType && (
              <Badge variant="outline" className="text-xs uppercase">
                {userType}
              </Badge>
            )}
            <Badge variant={tokenExpired ? "destructive" : "secondary"} className="text-xs">
              {tokenExpiresAt ? `Token ${tokenExpired ? "expired" : "valid"} · ${formatDateTime(tokenExpiresAt)}` : "Token loaded"}
            </Badge>
            <div className="flex items-center gap-2">
              {user.roles?.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
