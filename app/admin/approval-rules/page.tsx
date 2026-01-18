"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/layout/auth-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { adminApi } from "@/app/api/admin"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"
import type { ApprovalRule } from "@/app/types"

export default function ApprovalRulesPage() {
  const [error, setError] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["approval-rules"],
    queryFn: () => adminApi.getApprovalRules(),
  })

  const deactivateMutation = useMutation({
    mutationFn: (ruleName: string) => adminApi.deactivateApprovalRule(ruleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-rules"] })
      toast({ title: "Approval rule deactivated" })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })


  const columns = [
    {
      header: "Rule Name",
      cell: (rule: ApprovalRule) => (
        <Link
          href={`/admin/approval-rules/${encodeURIComponent(rule.ruleName)}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {rule.ruleName}
        </Link>
      ),
    },
    {
      header: "Priority",
      cell: (rule: ApprovalRule) => rule.priority,
    },
    {
      header: "Active",
      cell: (rule: ApprovalRule) => (rule.active ? "Yes" : "No"),
    },
    {
      header: "Levels",
      cell: (rule: ApprovalRule) => rule.levels.length,
    },
    {
      header: "Actions",
      cell: (rule: ApprovalRule) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            deactivateMutation.mutate(rule.ruleName)
          }}
          disabled={deactivateMutation.isPending || !rule.active}
        >
          Deactivate
        </Button>
      ),
    },
  ]

  return (
    <AuthLayout title="Approval Rules" requireAdmin>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium">Approval Rules</h3>
            <p className="text-sm text-muted-foreground">Create or deactivate approval rules</p>
          </div>
          <Button onClick={() => router.push("/admin/approval-rules/new")}>Add Rule</Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={(data ?? []).map((rule) => ({ ...rule, id: rule.ruleName }))}
          isLoading={isLoading}
          emptyMessage="No approval rules found"
          onRowClick={(rule) => router.push(`/admin/approval-rules/${encodeURIComponent(rule.ruleName)}`)}
        />

      </div>
    </AuthLayout>
  )
}
