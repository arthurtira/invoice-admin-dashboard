"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminApi } from "@/app/api/admin"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"
import type { PricingRule } from "@/app/types"

export default function PricingPolicyCreatePage() {
  const [error, setError] = useState("")
  const [ruleForm, setRuleForm] = useState({
    name: "",
    enabled: true,
    priority: 100,
    currency: "USD",
    minAmount: "0",
    maxAmount: "500000",
    minTenorDays: "0",
    maxTenorDays: "90",
    defaultRatePct: "3.25",
    minRatePct: "3.00",
    maxRatePct: "4.00",
    feeType: "BPS",
    feeRatePct: "0.50",
    feeFlatAmount: "0",
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  const createMutation = useMutation({
    mutationFn: (payload: Omit<PricingRule, "id">) => adminApi.createPricingRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] })
      toast({ title: "Pricing rule created" })
      setError("")
      router.push("/admin/pricing-policies")
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const parseNumberInput = (value: string) => {
    const normalized = value.replace(/,/g, "").replace(/%/g, "").trim()
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatNumberInput = (value: string) => {
    if (!value) return ""
    const parsed = parseNumberInput(value)
    return Number.isFinite(parsed) ? parsed.toLocaleString("en-US") : value
  }

  const formatPercentInput = (value: string) => {
    if (!value) return ""
    const parsed = parseNumberInput(value)
    return Number.isFinite(parsed) ? parsed.toFixed(2) : value
  }

  const handleCreate = () => {
    const currency = ruleForm.currency.trim().toUpperCase()
    const minAmount = parseNumberInput(ruleForm.minAmount)
    const maxAmount = parseNumberInput(ruleForm.maxAmount)
    const minTenorDays = parseNumberInput(ruleForm.minTenorDays)
    const maxTenorDays = parseNumberInput(ruleForm.maxTenorDays)
    const defaultRateBps = Math.round(parseNumberInput(ruleForm.defaultRatePct) * 100)
    const minRateBps = Math.round(parseNumberInput(ruleForm.minRatePct) * 100)
    const maxRateBps = Math.round(parseNumberInput(ruleForm.maxRatePct) * 100)

    let feeRateBps = 0
    let feeFlatAmount = 0
    if (ruleForm.feeType === "BPS") {
      feeRateBps = Math.round(parseNumberInput(ruleForm.feeRatePct) * 100)
    }
    if (ruleForm.feeType === "FLAT") {
      feeFlatAmount = parseNumberInput(ruleForm.feeFlatAmount)
    }

    createMutation.mutate({
      name: ruleForm.name,
      enabled: ruleForm.enabled,
      priority: ruleForm.priority,
      dimensions: {
        currency,
        minAmount,
        maxAmount,
        minTenorDays,
        maxTenorDays,
      },
      rates: {
        defaultRateBps,
        minRateBps,
        maxRateBps,
      },
      fees: {
        feeType: ruleForm.feeType as "BPS" | "FLAT" | "NONE",
        feeRateBps,
        feeFlatAmount,
      },
      effectiveFrom: ruleForm.effectiveFrom || null,
      effectiveTo: ruleForm.effectiveTo || null,
      notes: ruleForm.notes || null,
    })
  }

  return (
    <AuthLayout title="Create Pricing Rule" requireAdmin>
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Create Pricing Rule</h3>
            <p className="text-sm text-muted-foreground">Configure pricing dimensions, rates, and fees.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/pricing-policies")}>
            Back to Pricing Rules
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Rule Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
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
                  value={ruleForm.minAmount}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, minAmount: e.target.value }))}
                  onBlur={(e) =>
                    setRuleForm((prev) => ({ ...prev, minAmount: formatNumberInput(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount</Label>
                <Input
                  id="maxAmount"
                  value={ruleForm.maxAmount}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
                  onBlur={(e) =>
                    setRuleForm((prev) => ({ ...prev, maxAmount: formatNumberInput(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minTenorDays">Min Tenor Days</Label>
                <Input
                  id="minTenorDays"
                  type="number"
                  value={ruleForm.minTenorDays}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, minTenorDays: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTenorDays">Max Tenor Days</Label>
                <Input
                  id="maxTenorDays"
                  type="number"
                  value={ruleForm.maxTenorDays}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, maxTenorDays: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultRatePct">Default Rate (%)</Label>
                <Input
                  id="defaultRatePct"
                  value={ruleForm.defaultRatePct}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, defaultRatePct: e.target.value }))}
                  onBlur={(e) =>
                    setRuleForm((prev) => ({ ...prev, defaultRatePct: formatPercentInput(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minRatePct">Min Rate (%)</Label>
                <Input
                  id="minRatePct"
                  value={ruleForm.minRatePct}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, minRatePct: e.target.value }))}
                  onBlur={(e) =>
                    setRuleForm((prev) => ({ ...prev, minRatePct: formatPercentInput(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRatePct">Max Rate (%)</Label>
                <Input
                  id="maxRatePct"
                  value={ruleForm.maxRatePct}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, maxRatePct: e.target.value }))}
                  onBlur={(e) =>
                    setRuleForm((prev) => ({ ...prev, maxRatePct: formatPercentInput(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeType">Fee Type</Label>
                <Select
                  value={ruleForm.feeType}
                  onValueChange={(value) => setRuleForm((prev) => ({ ...prev, feeType: value }))}
                >
                  <SelectTrigger id="feeType">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">NONE</SelectItem>
                    <SelectItem value="FLAT">FLAT</SelectItem>
                    <SelectItem value="BPS">BPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeRatePct">Fee Rate (%)</Label>
                <Input
                  id="feeRatePct"
                  value={ruleForm.feeRatePct}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, feeRatePct: e.target.value }))}
                  onBlur={(e) =>
                    setRuleForm((prev) => ({ ...prev, feeRatePct: formatPercentInput(e.target.value) }))
                  }
                  disabled={ruleForm.feeType !== "BPS"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeFlatAmount">Fee Flat Amount</Label>
                <Input
                  id="feeFlatAmount"
                  value={ruleForm.feeFlatAmount}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, feeFlatAmount: e.target.value }))}
                  onBlur={(e) =>
                    setRuleForm((prev) => ({ ...prev, feeFlatAmount: formatNumberInput(e.target.value) }))
                  }
                  disabled={ruleForm.feeType !== "FLAT"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective From</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={ruleForm.effectiveFrom}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveTo">Effective To</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={ruleForm.effectiveTo}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={ruleForm.notes}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, notes: e.target.value }))}
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
