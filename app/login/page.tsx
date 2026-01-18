"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/app/context/auth-context"
import { requestDevToken, type UserType } from "@/app/api/auth"
import { getApiErrorMessage, getConfiguredApiBase } from "@/app/api/client"

export default function LoginPage() {
  const [userType, setUserType] = useState<UserType>("admin")
  const [apiBaseUrl, setApiBaseUrl] = useState("")
  const [error, setError] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    const configured = getConfiguredApiBase()
    const stored = localStorage.getItem("api_base_url")
    if (stored && /^https?:\/\//i.test(stored) && !stored.startsWith(window.location.origin)) {
      localStorage.setItem("api_base_url", "/api")
      setApiBaseUrl("/api")
    } else {
      setApiBaseUrl(configured.apiBase)
    }
    if (!isLoading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      setIsRequesting(true)
      localStorage.setItem("api_base_url", apiBaseUrl.trim())
      const authResponse = await requestDevToken(userType)
      const trimmedToken = authResponse.access_token.trim()
      if (!trimmedToken) {
        setError("Received an empty token")
        return
      }

      const success = login(trimmedToken, userType)
      if (success) {
        router.push("/")
      } else {
        setError("Invalid JWT token format")
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsRequesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Invoice Admin</CardTitle>
          <CardDescription>Fetch a dev token and access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>User Type</Label>
              <Select value={userType} onValueChange={(value) => setUserType(value as UserType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="junior2">Junior Two</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="senior2">Senior Two</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isRequesting}>
              {isRequesting ? "Requesting token..." : "Get Token"}
            </Button>
          </form>

          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Dev Mode:</strong> This is a development login page. In production, authentication is handled
              externally and the JWT token is provided automatically.
            </p>
            
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
