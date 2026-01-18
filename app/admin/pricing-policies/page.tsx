"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AuthLayout } from "@/components/layout/auth-layout"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { adminApi } from "@/app/api/admin"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"
import type { PricingRule } from "@/app/types"

export default function PricingPoliciesPage() {
  const [error, setError] = useState("")
  const [ruleForm, setRuleForm] = useState({
    name: "",
    enabled: true,
    priority: 100,
    currency: "USD",
    minAmount: 0,
    maxAmount: 500000,
    minTenorDays: 0,
    maxTenorDays: 90,
    defaultRateBps: 325,
    minRateBps: 300,
    maxRateBps: 400,
    feeType: "BPS",
    feeRateBps: 50,
    feeFlatAmount: 0,
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: () => adminApi.getPricingRules(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Omit<PricingRule, "id">) => adminApi.createPricingRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] })
      toast({ title: "Pricing rule created" })
      setError("")
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const disableMutation = useMutation({
    mutationFn: (ruleId: string) => adminApi.disablePricingRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] })
      toast({ title: "Pricing rule disabled" })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const handleCreate = () => {
    createMutation.mutate({
      name: ruleForm.name,
      enabled: ruleForm.enabled,
      priority: ruleForm.priority,
      dimensions: {
        currency: ruleForm.currency,
        minAmount: ruleForm.minAmount,
        maxAmount: ruleForm.maxAmount,
        minTenorDays: ruleForm.minTenorDays,
        maxTenorDays: ruleForm.maxTenorDays,
      },
      rates: {
        defaultRateBps: ruleForm.defaultRateBps,
        minRateBps: ruleForm.minRateBps,
        maxRateBps: ruleForm.maxRateBps,
      },
      fees: {
        feeType: ruleForm.feeType as "BPS" | "FLAT",
        feeRateBps: ruleForm.feeRateBps,
        feeFlatAmount: ruleForm.feeFlatAmount,
      },
    })
  }

  const columns = [
    {
      header: "Rule ID",
      cell: (rule: PricingRule) => <span className="font-mono text-sm">{rule.id}</span>,
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
        <div>
          <h3 className="text-lg font-medium">Pricing Rules</h3>
          <p className="text-sm text-muted-foreground">Create or disable pricing rules</p>
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
        />

        <Card>
          <CardHeader>
            <CardTitle>Create Pricing Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Name</Label>
                <Input
                  id="ruleName"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="enabled"
                  checked={ruleForm.enabled}
                  onCheckedChange={(checked) => setRuleForm((prev) => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={ruleForm.currency}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, currency: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Amount</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={ruleForm.minAmount}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, minAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  value={ruleForm.maxAmount}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, maxAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minTenorDays">Min Tenor Days</Label>
                <Input
                  id="minTenorDays"
                  type="number"
                  value={ruleForm.minTenorDays}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, minTenorDays: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTenorDays">Max Tenor Days</Label>
                <Input
                  id="maxTenorDays"
                  type="number"
                  value={ruleForm.maxTenorDays}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, maxTenorDays: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultRateBps">Default Rate (bps)</Label>
                <Input
                  id="defaultRateBps"
                  type="number"
                  value={ruleForm.defaultRateBps}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, defaultRateBps: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minRateBps">Min Rate (bps)</Label>
                <Input
                  id="minRateBps"
                  type="number"
                  value={ruleForm.minRateBps}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, minRateBps: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRateBps">Max Rate (bps)</Label>
                <Input
                  id="maxRateBps"
                  type="number"
                  value={ruleForm.maxRateBps}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, maxRateBps: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeType">Fee Type</Label>
                <Input
                  id="feeType"
                  value={ruleForm.feeType}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, feeType: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeRateBps">Fee Rate (bps)</Label>
                <Input
                  id="feeRateBps"
                  type="number"
                  value={ruleForm.feeRateBps}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, feeRateBps: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeFlatAmount">Fee Flat Amount</Label>
                <Input
                  id="feeFlatAmount"
                  type="number"
                  value={ruleForm.feeFlatAmount}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, feeFlatAmount: Number(e.target.value) }))}
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
