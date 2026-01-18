"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { adminApi } from "@/app/api/admin"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"

export default function NewRolePage() {
  const [error, setError] = useState("")
  const [bankRole, setBankRole] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => adminApi.getPermissions(),
  })

  const permissionsByGroup = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    ;(permissions ?? []).forEach((permission) => {
      const [group] = permission.name.split(":")
      if (!grouped[group]) {
        grouped[group] = []
      }
      grouped[group].push(permission.name)
    })
    return grouped
  }, [permissions])

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createRole({
        bankRole,
        name,
        description,
        permissions: selectedPermissions,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast({ title: "Role created" })
      router.push("/admin/roles")
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission],
    )
  }

  const handleSubmit = () => {
    if (!bankRole || !name) {
      setError("Bank role and role name are required.")
      return
    }
    setError("")
    createMutation.mutate()
  }

  return (
    <AuthLayout title="Add Role" requireAdmin>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div>
          <h3 className="text-2xl font-semibold">Create Role</h3>
          <p className="text-sm text-muted-foreground">Assign permissions by selecting them below.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
            <CardDescription>Define the role and assign permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankRole">Bank Role</Label>
                <Input id="bankRole" value={bankRole} onChange={(e) => setBankRole(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Permissions</p>
                  <p className="text-xs text-muted-foreground">Select one or more permissions for this role.</p>
                </div>
                <span className="text-xs text-muted-foreground">{selectedPermissions.length} selected</span>
              </div>
              <div className="max-h-72 space-y-4 overflow-auto rounded-lg border border-border bg-muted/20 p-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading permissions...</p>
                ) : (
                  Object.entries(permissionsByGroup).map(([group, items]) => (
                    <div key={group} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {items.map((permission) => (
                          <label key={permission} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selectedPermissions.includes(permission)}
                              onCheckedChange={() => togglePermission(permission)}
                            />
                            <span className="font-mono text-xs">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.push("/admin/roles")}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
