"use client"

import { useQuery } from "@tanstack/react-query"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminApi } from "@/app/api/admin"

export default function PermissionsPage() {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => adminApi.getPermissions(),
  })

  return (
    <AuthLayout title="Permissions" requireAdmin>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">System Permissions</h3>
          <p className="text-sm text-muted-foreground">Available permissions for role configuration.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading permissions...</p>
            ) : !permissions?.length ? (
              <p className="text-sm text-muted-foreground">No permissions returned.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {permissions.map((permission) => (
                  <div key={permission.id} className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="font-mono text-xs">{permission.name}</p>
                    {permission.description && (
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
