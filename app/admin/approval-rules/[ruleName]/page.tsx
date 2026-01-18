"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { adminApi } from "@/app/api/admin"
import type { ApprovalRule } from "@/app/types"

export default function ApprovalRuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ruleNameParam = decodeURIComponent(params.ruleName as string)

  const { data, isLoading } = useQuery({
    queryKey: ["approval-rules"],
    queryFn: () => adminApi.getApprovalRules(),
  })

  const rule = useMemo(
    () => (data ?? []).find((item) => item.ruleName === ruleNameParam) ?? null,
    [data, ruleNameParam],
  )

  if (isLoading) {
    return (
      <AuthLayout title="Approval Rule" requireAdmin>
        <div className="flex h-48 items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </AuthLayout>
    )
  }

  if (!rule) {
    return (
      <AuthLayout title="Approval Rule" requireAdmin>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Approval rule not found.</p>
          <Button variant="outline" onClick={() => router.push("/admin/approval-rules")}>
            Back to Approval Rules
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Approval Rule" requireAdmin>
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Approval Rule</h3>
            <p className="text-sm text-muted-foreground">Rule configuration and levels</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/approval-rules")}>
            Back to Approval Rules
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Rule Name</p>
                <p className="font-mono text-sm">{rule.ruleName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p>{rule.priority}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p>{rule.active ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Levels</p>
                <p>{rule.levels.length}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Criteria</p>
              <div className="space-y-2">
                {rule.criteria.map((criteria, index) => (
                  <div
                    key={`${criteria.dimension}-${criteria.operator}-${index}`}
                    className="grid gap-2 rounded-lg border border-border/60 p-2 md:grid-cols-[140px_140px_1fr_1fr]"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">Dimension</p>
                      <p className="text-sm">{criteria.dimension}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Operator</p>
                      <p className="text-sm">{criteria.operator}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="text-sm">{criteria.value || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Value 2</p>
                      <p className="text-sm">{criteria.value2 || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Levels</p>
              <div className="space-y-2">
                {rule.levels.map((level) => (
                  <div key={level.level} className="rounded-lg border border-border/60 p-2">
                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="text-sm">{level.level}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Required Approvals</p>
                        <p className="text-sm">{level.requiredApprovals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Description</p>
                        <p className="text-sm">{level.description || "-"}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Roles</p>
                      <p className="text-sm">{level.roles.join(", ") || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
