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
import type { PricingRule } from "@/app/types"

export default function PricingPoliciesPage() {
  const [error, setError] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: () => adminApi.getPricingRules(),
  })

  const disableMutation = useMutation({
    mutationFn: (ruleId: string) => adminApi.disablePricingRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] })
      toast({ title: "Pricing rule disabled" })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })


  const columns = [
    {
      header: "Rule ID",
      cell: (rule: PricingRule) => (
        <Link
          href={`/admin/pricing-policies/${encodeURIComponent(rule.id)}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {rule.id}
        </Link>
      ),
    },
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "Currency",
      cell: (rule: PricingRule) => rule.dimensions.currency,
    },
    {
      header: "Amount Range",
      cell: (rule: PricingRule) => `${rule.dimensions.minAmount} - ${rule.dimensions.maxAmount}`,
    },
    {
      header: "Tenor Range",
      cell: (rule: PricingRule) => `${rule.dimensions.minTenorDays} - ${rule.dimensions.maxTenorDays} days`,
    },
    {
      header: "Enabled",
      cell: (rule: PricingRule) => (rule.enabled ? "Yes" : "No"),
    },
    {
      header: "Actions",
      cell: (rule: PricingRule) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            disableMutation.mutate(rule.id)
          }}
          disabled={disableMutation.isPending || !rule.enabled}
        >
          Disable
        </Button>
      ),
    },
  ]

  return (
    <AuthLayout title="Pricing Rules" requireAdmin>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium">Pricing Rules</h3>
            <p className="text-sm text-muted-foreground">Create or disable pricing rules</p>
          </div>
          <Button onClick={() => router.push("/admin/pricing-policies/new")}>Add Rule</Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={(data ?? []).map((rule) => ({ ...rule, id: rule.id }))}
          isLoading={isLoading}
          emptyMessage="No pricing rules found"
          onRowClick={(rule) => router.push(`/admin/pricing-policies/${encodeURIComponent(rule.id)}`)}
        />

      </div>
    </AuthLayout>
  )
}
