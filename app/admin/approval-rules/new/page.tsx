"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminApi } from "@/app/api/admin"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"
import type { ApprovalRule } from "@/app/types"

export default function ApprovalRuleCreatePage() {
  const [error, setError] = useState("")
  const [ruleForm, setRuleForm] = useState({
    ruleName: "",
    priority: 100,
    active: true,
    criteria: [{ dimension: "AMOUNT", operator: "BETWEEN", value: "0", value2: "20000" }],
    levels: [{ level: 1, roles: ["JUNIOR_OFFICER"], requiredApprovals: 1, description: "" }],
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  const { data: systemRoles } = useQuery({
    queryKey: ["system-roles"],
    queryFn: () => adminApi.getRoles(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: ApprovalRule) => adminApi.createApprovalRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-rules"] })
      toast({ title: "Approval rule created" })
      setError("")
      router.push("/admin/approval-rules")
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const handleCreate = () => {
    if (!ruleForm.ruleName.trim()) {
      setError("Rule name is required.")
      return
    }
    if (!ruleForm.criteria.length) {
      setError("At least one criteria entry is required.")
      return
    }
    if (!ruleForm.levels.length) {
      setError("At least one level is required.")
      return
    }
    createMutation.mutate({
      ruleName: ruleForm.ruleName.trim(),
      priority: ruleForm.priority,
      active: ruleForm.active,
      criteria: ruleForm.criteria.map((item) => ({
        dimension: item.dimension,
        operator: item.operator,
        value: item.value,
        value2: item.value2 || undefined,
      })),
      levels: ruleForm.levels.map((level) => ({
        level: level.level,
        roles: level.roles,
        requiredApprovals: level.requiredApprovals,
        description: level.description || "",
      })),
    })
  }

  const addCriteria = () => {
    setRuleForm((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { dimension: "AMOUNT", operator: "BETWEEN", value: "", value2: "" }],
    }))
  }

  const updateCriteria = (index: number, key: "dimension" | "operator" | "value" | "value2", value: string) => {
    setRuleForm((prev) => ({
      ...prev,
      criteria: prev.criteria.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }))
  }

  const removeCriteria = (index: number) => {
    setRuleForm((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, idx) => idx !== index),
    }))
  }

  const addLevel = () => {
    setRuleForm((prev) => ({
      ...prev,
      levels: [
        ...prev.levels,
        { level: prev.levels.length + 1, roles: [], requiredApprovals: 1, description: "" },
      ],
    }))
  }

  const updateLevel = (
    index: number,
    key: "level" | "requiredApprovals" | "description" | "roles",
    value: string | number | string[],
  ) => {
    setRuleForm((prev) => ({
      ...prev,
      levels: prev.levels.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }))
  }

  const removeLevel = (index: number) => {
    setRuleForm((prev) => ({
      ...prev,
      levels: prev.levels.filter((_, idx) => idx !== index),
    }))
  }

  return (
    <AuthLayout title="Create Approval Rule" requireAdmin>
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Create Approval Rule</h3>
            <p className="text-sm text-muted-foreground">Configure criteria and approval levels.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/approval-rules")}>
            Back to Approval Rules
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  value={ruleForm.ruleName}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, ruleName: e.target.value }))}
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
                  id="active"
                  checked={ruleForm.active}
                  onCheckedChange={(checked) => setRuleForm((prev) => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold">Criteria</h5>
                <Button type="button" size="sm" variant="outline" onClick={addCriteria}>
                  Add Criteria
                </Button>
              </div>
              <div className="space-y-2">
                {ruleForm.criteria.map((criteria, index) => (
                  <Card key={`criteria-${index}`}>
                    <CardContent className="grid gap-3 pt-4 md:grid-cols-[160px_160px_1fr_1fr_auto]">
                      <div className="space-y-2">
                        <Label>Dimension</Label>
                        <Select
                          value={criteria.dimension}
                          onValueChange={(value) => updateCriteria(index, "dimension", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select dimension" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AMOUNT">AMOUNT</SelectItem>
                            <SelectItem value="TENOR_DAYS">TENOR_DAYS</SelectItem>
                            <SelectItem value="CURRENCY">CURRENCY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select
                          value={criteria.operator}
                          onValueChange={(value) => updateCriteria(index, "operator", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EQ">EQ</SelectItem>
                            <SelectItem value="NEQ">NEQ</SelectItem>
                            <SelectItem value="LT">LT</SelectItem>
                            <SelectItem value="LTE">LTE</SelectItem>
                            <SelectItem value="GT">GT</SelectItem>
                            <SelectItem value="GTE">GTE</SelectItem>
                            <SelectItem value="IN">IN</SelectItem>
                            <SelectItem value="NOT_IN">NOT_IN</SelectItem>
                            <SelectItem value="EXISTS">EXISTS</SelectItem>
                            <SelectItem value="BETWEEN">BETWEEN</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                          value={criteria.value}
                          disabled={criteria.operator === "EXISTS"}
                          placeholder={criteria.operator === "IN" || criteria.operator === "NOT_IN" ? "Comma-separated" : ""}
                          onChange={(e) => updateCriteria(index, "value", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Value 2</Label>
                        <Input
                          value={criteria.value2 || ""}
                          disabled={criteria.operator !== "BETWEEN"}
                          placeholder={criteria.operator === "BETWEEN" ? "Required for BETWEEN" : ""}
                          onChange={(e) => updateCriteria(index, "value2", e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCriteria(index)}>
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold">Levels</h5>
                <Button type="button" size="sm" variant="outline" onClick={addLevel}>
                  Add Level
                </Button>
              </div>
              <div className="space-y-2">
                {ruleForm.levels.map((level, index) => (
                  <Card key={`level-${index}`}>
                    <CardContent className="grid gap-3 pt-4 md:grid-cols-[120px_140px_1fr_auto]">
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Input
                          type="number"
                          value={level.level}
                          onChange={(e) => updateLevel(index, "level", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Approvals</Label>
                        <Input
                          type="number"
                          value={level.requiredApprovals}
                          onChange={(e) => updateLevel(index, "requiredApprovals", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={level.description}
                          onChange={(e) => updateLevel(index, "description", e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLevel(index)}>
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-2 md:col-span-4">
                        <Label>Roles</Label>
                        <div className="grid gap-2 md:grid-cols-2">
                          {(systemRoles ?? []).map((role) => {
                            const checked = level.roles.includes(role.name)
                            return (
                              <label key={role.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const next = value
                                      ? [...level.roles, role.name]
                                      : level.roles.filter((item) => item !== role.name)
                                    updateLevel(index, "roles", next)
                                  }}
                                />
                                <span>{role.name}</span>
                              </label>
                            )
                          })}
                        </div>
                        {!systemRoles?.length && (
                          <p className="text-xs text-muted-foreground">No system roles found.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
