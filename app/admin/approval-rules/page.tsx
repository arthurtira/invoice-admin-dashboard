"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AuthLayout } from "@/components/layout/auth-layout"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { adminApi } from "@/app/api/admin"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"
import type { ApprovalRule } from "@/app/types"

export default function ApprovalRulesPage() {
  const [selectedRule, setSelectedRule] = useState<ApprovalRule | null>(null)
  const [error, setError] = useState("")
  const [ruleForm, setRuleForm] = useState({
    ruleName: "",
    priority: 100,
    active: true,
    criteriaJson: '[{"dimension":"AMOUNT","operator":"BETWEEN","value":"0","value2":"20000"}]',
    levelsJson:
      '[{"level":1,"roles":["JUNIOR_OFFICER"],"requiredApprovals":2,"description":"Level 1"}]',
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ["approval-rules"],
    queryFn: () => adminApi.getApprovalRules(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: ApprovalRule) => adminApi.createApprovalRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-rules"] })
      toast({ title: "Approval rule created" })
      setError("")
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const deactivateMutation = useMutation({
    mutationFn: (ruleName: string) => adminApi.deactivateApprovalRule(ruleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-rules"] })
      toast({ title: "Approval rule deactivated" })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const handleCreate = () => {
    try {
      const criteria = JSON.parse(ruleForm.criteriaJson) as ApprovalRule["criteria"]
      const levels = JSON.parse(ruleForm.levelsJson) as ApprovalRule["levels"]
      createMutation.mutate({
        ruleName: ruleForm.ruleName,
        priority: ruleForm.priority,
        active: ruleForm.active,
        criteria,
        levels,
      })
    } catch {
      setError("Criteria or levels JSON is invalid.")
    }
  }

  const columns = [
    {
      header: "Rule Name",
      cell: (rule: ApprovalRule) => <span className="font-mono text-sm">{rule.ruleName}</span>,
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
        <div>
          <h3 className="text-lg font-medium">Approval Rules</h3>
          <p className="text-sm text-muted-foreground">Create or deactivate approval rules</p>
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
          onRowClick={setSelectedRule}
        />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h4 className="text-base font-semibold">Create Rule</h4>
            <div className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="criteria">Criteria (JSON)</Label>
                <Textarea
                  id="criteria"
                  value={ruleForm.criteriaJson}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, criteriaJson: e.target.value }))}
                  className="min-h-28 font-mono text-xs"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="levels">Levels (JSON)</Label>
                <Textarea
                  id="levels"
                  value={ruleForm.levelsJson}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, levelsJson: e.target.value }))}
                  className="min-h-28 font-mono text-xs"
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approval Rule Details</DialogTitle>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rule Name</p>
                  <p className="font-mono text-sm">{selectedRule.ruleName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p>{selectedRule.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criteria</p>
                  <Card className="mt-1">
                    <CardContent className="p-3">
                      <pre className="overflow-auto text-xs font-mono">
                        {JSON.stringify(selectedRule.criteria, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Levels</p>
                  <Card className="mt-1">
                    <CardContent className="p-3">
                      <pre className="overflow-auto text-xs font-mono">
                        {JSON.stringify(selectedRule.levels, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AuthLayout>
  )
}
