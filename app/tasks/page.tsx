"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { AuthLayout } from "@/components/layout/auth-layout"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { tasksApi } from "@/app/api/tasks"
import { getApiErrorMessage } from "@/app/api/client"
import { truncateId, formatDate } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import type { ApprovalTask } from "@/app/types"
import { useAuthContext } from "@/app/context/auth-context"

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_ACTIONABLE")
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    task: ApprovalTask | null
    action: "APPROVE" | "REJECT" | null
  }>({ open: false, task: null, action: null })
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", statusFilter],
    queryFn: () => tasksApi.getAll(statusFilter === "ALL" ? undefined : statusFilter),
  })

  const { data: allTasks } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: () => tasksApi.getAll(),
    enabled: statusFilter !== "ALL",
  })

  const actionMutation = useMutation({
    mutationFn: ({ taskId, action, reason }: { taskId: string; action: "APPROVE" | "REJECT"; reason: string }) =>
      tasksApi.performAction(taskId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      setActionDialog({ open: false, task: null, action: null })
      setReason("")
      setError("")
      toast({ title: "Action completed successfully" })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
      toast({ title: "Failed to perform action", variant: "destructive" })
    },
  })

  const handleAction = (task: ApprovalTask, action: "APPROVE" | "REJECT") => {
    setActionDialog({ open: true, task, action })
  }

  const confirmAction = () => {
    if (actionDialog.task && actionDialog.action) {
      actionMutation.mutate({
        taskId: actionDialog.task.taskId,
        action: actionDialog.action,
        reason,
      })
    }
  }

  const currentUserId = user?.sub ?? null
  const normalizedUserRoles = useMemo(() => {
    return new Set((user?.roles ?? []).map((role) => role.toLowerCase().trim()).filter(Boolean))
  }, [user])

  const roleOverlap = (rolesA: string[], rolesB: string[]) => {
    if (!rolesA.length || !rolesB.length) return false
    const setB = new Set(rolesB)
    return rolesA.some((role) => setB.has(role))
  }

  const userRelevantRoles = (task: ApprovalTask) =>
    task.candidateRoles.map((role) => role.toLowerCase().trim()).filter((role) => normalizedUserRoles.has(role))

  const tasksForRestriction = statusFilter === "ALL" ? data ?? [] : allTasks ?? []

  const hasUserActionedDealRole = (task: ApprovalTask) => {
    if (!currentUserId || normalizedUserRoles.size === 0) return false
    const taskRoles = userRelevantRoles(task)
    if (!taskRoles.length) return false
    return tasksForRestriction.some((other) => {
      if (other.taskId === task.taskId) return false
      if (other.dealId !== task.dealId) return false
      if (other.actionedBy !== currentUserId) return false
      const otherRoles = userRelevantRoles(other)
      return roleOverlap(taskRoles, otherRoles)
    })
  }

  const columns = [
    {
      header: "Deal ID",
      cell: (task: ApprovalTask) => (
        <Link href={`/invoices/${task.invoiceId}`} className="font-mono text-sm text-primary hover:underline">
          {truncateId(task.dealId)}
        </Link>
      ),
    },
    {
      header: "Level",
      cell: (task: ApprovalTask) => `Level ${task.levelNumber}`,
    },
    {
      header: "Status",
      cell: (task: ApprovalTask) => <StatusBadge status={task.status} />,
    },
    {
      header: "Candidates",
      cell: (task: ApprovalTask) => (
        <span className="text-xs text-muted-foreground">{task.candidateRoles.join(", ")}</span>
      ),
    },
    {
      header: "Created",
      cell: (task: ApprovalTask) => formatDate(task.createdAt),
    },
    {
      header: "Actions",
      cell: (task: ApprovalTask) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {task.status === "PENDING_ACTIONABLE" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(task, "APPROVE")}
                disabled={hasUserActionedDealRole(task)}
                title={hasUserActionedDealRole(task) ? "You already actioned an approval for this deal and role." : ""}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(task, "REJECT")}
                disabled={hasUserActionedDealRole(task)}
                title={hasUserActionedDealRole(task) ? "You already actioned an approval for this deal and role." : ""}
              >
                Reject
              </Button>
            </>
          )}
          <Link href={`/invoices/${task.invoiceId}?taskId=${task.taskId}`}>
            <Button variant="ghost" size="sm">
              View Invoice
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <AuthLayout title="Tasks">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Approval Tasks</h3>
            <p className="text-sm text-muted-foreground">Manage and process approval tasks</p>
          </div>

          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING_ACTIONABLE">Pending Actionable</SelectItem>
                <SelectItem value="PENDING_BLOCKED">Pending Blocked</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={(data ?? []).map((task) => ({ ...task, id: task.taskId }))}
          isLoading={isLoading}
          emptyMessage="No tasks found"
        />
      </div>

      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && setActionDialog({ open: false, task: null, action: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.action === "APPROVE" ? "Approve Task" : "Reject Task"}</DialogTitle>
            <DialogDescription>
              {actionDialog.action === "APPROVE"
                ? "Are you sure you want to approve this task?"
                : "Are you sure you want to reject this task?"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, task: null, action: null })}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={actionMutation.isPending}
              variant={actionDialog.action === "REJECT" ? "destructive" : "default"}
            >
              {actionMutation.isPending ? "Processing..." : actionDialog.action === "APPROVE" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  )
}
