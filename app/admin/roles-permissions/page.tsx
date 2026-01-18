"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RolesPermissionsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/roles")
  }, [router])

  return (
    <AuthLayout title="Roles & Permissions" requireAdmin>
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Redirecting to the roles page...</p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
