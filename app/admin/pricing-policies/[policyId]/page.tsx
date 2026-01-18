"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { adminApi } from "@/app/api/admin"

export default function PricingPolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const policyId = params.policyId as string

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: () => adminApi.getPricingRules(),
  })

  const rule = useMemo(() => (data ?? []).find((item) => item.id === policyId) ?? null, [data, policyId])

  if (isLoading) {
    return (
      <AuthLayout title="Pricing Rule" requireAdmin>
        <div className="flex h-48 items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </AuthLayout>
    )
  }

  if (!rule) {
    return (
      <AuthLayout title="Pricing Rule" requireAdmin>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Pricing rule not found.</p>
          <Button variant="outline" onClick={() => router.push("/admin/pricing-policies")}>
            Back to Pricing Rules
          </Button>
        </div>
      </AuthLayout>
    )
  }

  const formatPercent = (bps: number) => `${(bps / 100).toFixed(2)}%`
  const formatAmount = (amount: number) => amount.toLocaleString("en-US")

  return (
    <AuthLayout title="Pricing Rule" requireAdmin>
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Pricing Rule</h3>
            <p className="text-sm text-muted-foreground">Rule configuration details</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/pricing-policies")}>
            Back to Pricing Rules
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Rule ID</p>
                <p className="font-mono text-sm">{rule.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p>{rule.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enabled</p>
                <p>{rule.enabled ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p>{rule.priority}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Effective From</p>
                <p>{rule.effectiveFrom || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Effective To</p>
                <p>{rule.effectiveTo || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Dimensions</p>
              <Card className="mt-2">
                <CardContent className="p-2">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Currency</span>
                      <p>{rule.dimensions.currency}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Amount Range</span>
                      <p>
                        {formatAmount(rule.dimensions.minAmount)} - {formatAmount(rule.dimensions.maxAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Tenor Range</span>
                      <p>
                        {rule.dimensions.minTenorDays} - {rule.dimensions.maxTenorDays} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Rates</p>
              <Card className="mt-2">
                <CardContent className="p-2">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Default Rate</span>
                      <p>{formatPercent(rule.rates.defaultRateBps)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Min Rate</span>
                      <p>{formatPercent(rule.rates.minRateBps)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Max Rate</span>
                      <p>{formatPercent(rule.rates.maxRateBps)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Fees</p>
              <Card className="mt-2">
                <CardContent className="p-2">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Fee Type</span>
                      <p>{rule.fees.feeType}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Fee Rate</span>
                      <p>{rule.fees.feeType === "BPS" ? formatPercent(rule.fees.feeRateBps) : "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Flat Fee</span>
                      <p>{rule.fees.feeType === "FLAT" ? formatAmount(rule.fees.feeFlatAmount) : "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{rule.notes || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
