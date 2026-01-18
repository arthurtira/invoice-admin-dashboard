"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { adminApi } from "@/app/api/admin"
import type { SystemRole } from "@/app/types"

export default function RolesPage() {
  const router = useRouter()
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => adminApi.getRoles(),
  })

  const columns = [
    {
      header: "Role ID",
      cell: (role: SystemRole) => <span className="font-mono text-sm">{role.id}</span>,
    },
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "Bank Role",
      accessorKey: "bankRole" as const,
    },
    {
      header: "Permissions",
      cell: (role: SystemRole) => <span className="text-xs text-muted-foreground">{role.permissions.length}</span>,
    },
  ]

  return (
    <AuthLayout title="Roles" requireAdmin>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Roles</h3>
            <p className="text-sm text-muted-foreground">Manage system roles and permissions.</p>
          </div>
          <Button onClick={() => router.push("/admin/roles/new")}>Add Role</Button>
        </div>

        <DataTable
          columns={columns}
          data={(roles ?? []).map((role) => ({ ...role, id: role.id }))}
          isLoading={isLoading}
          emptyMessage="No roles found"
        />
      </div>
    </AuthLayout>
  )
}
