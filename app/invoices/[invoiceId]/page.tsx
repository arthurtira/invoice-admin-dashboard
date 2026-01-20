"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { invoicesApi } from "@/app/api/invoices"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"
import { tasksApi } from "@/app/api/tasks"
import { useAuthContext } from "@/app/context/auth-context"

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.invoiceId as string
  const [error, setError] = useState("")
  const [dealForm, setDealForm] = useState({ discountRate: 0, transactionFee: 0, sourceSystem: "" })
  const [actionReason, setActionReason] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthContext()
  const searchParams = useSearchParams()
  const taskIdParam = searchParams.get("taskId")

  const { data: invoiceResponse, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
    enabled: !!invoiceId,
  })

  const { data: dealResponse } = useQuery({
    queryKey: ["invoice-deal", invoiceId],
    queryFn: () => invoicesApi.getDeal(invoiceId),
    enabled: !!invoiceId,
  })

  const { data: eventsResponse } = useQuery({
    queryKey: ["invoice-events", invoiceId],
    queryFn: () => invoicesApi.getEvents(invoiceId),
    enabled: !!invoiceId,
  })


  const updateDealMutation = useMutation({
    mutationFn: (payload: { discountRate?: number; transactionFee?: number; sourceSystem?: string }) =>
      invoicesApi.updateDeal(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-deal", invoiceId] })
      toast({ title: "Deal updated" })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const submitDealMutation = useMutation({
    mutationFn: () => invoicesApi.submitDeal(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-deal", invoiceId] })
      toast({ title: "Deal submitted" })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const taskActionMutation = useMutation({
    mutationFn: ({ taskId, action, reason }: { taskId: string; action: "APPROVE" | "REJECT"; reason: string }) =>
      tasksApi.performAction(taskId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-deal", invoiceId] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      setActionReason("")
      toast({ title: "Task updated" })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  useEffect(() => {
    if (dealResponse?.data?.deal) {
      setDealForm({
        discountRate: dealResponse.data.deal.discountRate,
        transactionFee: dealResponse.data.deal.transactionFee,
        sourceSystem: dealResponse.data.deal.sourceSystem || "",
      })
    }
  }, [dealResponse])

  const invoice = invoiceResponse?.data?.invoice
  const deal = dealResponse?.data?.deal
  const canEditDeal = deal?.status === "DRAFT"

  const approvalTasks = useMemo(() => dealResponse?.data?.approvalTasks ?? [], [dealResponse])

  const approvalLevels = useMemo(() => {
    if (!approvalTasks.length) {
      return []
    }
    const grouped = new Map<number, typeof approvalTasks>()
    approvalTasks.forEach((task) => {
      const existing = grouped.get(task.levelNumber) || []
      existing.push(task)
      grouped.set(task.levelNumber, existing)
    })
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, tasks]) => {
        const approvedCount = tasks.filter((task) => task.status === "APPROVED").length
        const rejectedCount = tasks.filter((task) => task.status === "REJECTED").length
        const actionableCount = tasks.filter((task) => task.status === "PENDING_ACTIONABLE").length
        const blockedCount = tasks.filter((task) => task.status === "PENDING_BLOCKED").length
        const total = tasks.length
        let status = "PENDING"
        if (rejectedCount > 0) status = "REJECTED"
        else if (approvedCount === total) status = "APPROVED"
        else if (actionableCount > 0) status = "ACTIONABLE"
        else if (blockedCount > 0) status = "BLOCKED"
        const candidateRoles = Array.from(new Set(tasks.flatMap((task) => task.candidateRoles)))
        const actionedBy = tasks.filter((task) => task.actionedBy).map((task) => task.actionedBy)
        const sortedTasks = [...tasks].sort((a, b) => {
          const aDate = a.actionedAt || a.createdAt
          const bDate = b.actionedAt || b.createdAt
          return new Date(aDate).getTime() - new Date(bDate).getTime()
        })
        return {
          level,
          status,
          total,
          approvedCount,
          actionableCount,
          blockedCount,
          rejectedCount,
          candidateRoles,
          actionedBy,
          tasks: sortedTasks,
        }
      })
  }, [approvalTasks])

  const formatPercent = (value: number) =>
    Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "-"

  const submittedBy = deal?.submittedBy ?? null
  const submittedAt = deal?.submittedAt ?? null

  const invoiceEvents = useMemo(() => {
    const events = eventsResponse?.data ?? []
    return [...events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [eventsResponse])

  const actionableTask = useMemo(() => {
    if (!approvalTasks.length) return null
    if (!taskIdParam) return null
    return approvalTasks.find((task) => task.taskId === taskIdParam) ?? null
  }, [approvalTasks, taskIdParam])

  const currentUserId = user?.sub ?? null
  const normalizedUserRoles = useMemo(() => {
    return new Set((user?.roles ?? []).map((role) => role.toLowerCase().trim()).filter(Boolean))
  }, [user])

  const isActionBlocked = useMemo(() => {
    if (!actionableTask) return false
    if (!currentUserId || normalizedUserRoles.size === 0) return false
    const taskRoles = actionableTask.candidateRoles
      .map((role) => role.toLowerCase().trim())
      .filter((role) => normalizedUserRoles.has(role))
    if (!taskRoles.length) return false
    return approvalTasks.some((other) => {
      if (other.taskId === actionableTask.taskId) return false
      if (other.dealId !== actionableTask.dealId) return false
      if (other.actionedBy !== currentUserId) return false
      const otherRoles = other.candidateRoles
        .map((role) => role.toLowerCase().trim())
        .filter((role) => normalizedUserRoles.has(role))
      if (!otherRoles.length) return false
      const otherRoleSet = new Set(otherRoles)
      return taskRoles.some((role) => otherRoleSet.has(role))
    })
  }, [actionableTask, approvalTasks, currentUserId, normalizedUserRoles])

  const timelineItems = useMemo(() => {
    if (!invoiceEvents.length) {
      return []
    }
    const labelMap: Record<string, string> = {
      INVOICE_SUBMITTED: "Invoice created",
      DEAL_SUBMITTED: "Deal submitted",
      WORKFLOW_CREATED: "Approval workflow created",
      APPROVAL_ACTIONED: "Approval action",
    }
    return invoiceEvents.map((event) => ({
      id: event.eventId,
      title: labelMap[event.eventType] || event.eventType.replace(/_/g, " ").toLowerCase(),
      actor: event.actorId || "System",
      createdAt: event.createdAt,
      reason: event.reason,
    }))
  }, [invoiceEvents])

  if (isLoading) {
    return (
      <AuthLayout title="Invoice Details">
        <div className="flex h-48 items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </AuthLayout>
    )
  }

  if (!invoice) {
    return (
      <AuthLayout title="Invoice Details">
        <div className="flex h-48 items-center justify-center">
          <span className="text-muted-foreground">Invoice not found</span>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Invoice Details">
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="rounded-2xl border border-border/60 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">Invoice Overview</h2>
                    <p className="text-sm text-muted-foreground">Invoice details first, deal summary below.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={invoice.status} />
                    {deal && <StatusBadge status={deal.status} />}
                  </div>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice Number</p>
                    <p className="text-2xl font-semibold">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Invoice Value</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(invoice.invoiceAmount, invoice.currency)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">External Ref</p>
                      <p className="text-sm">{invoice.externalInvoiceId || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Document Ref</p>
                      <p className="text-sm">{invoice.documentRef || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Issue Date</p>
                      <p className="text-sm">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tenor</p>
                      <p className="text-sm">{invoice.tenorDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Currency</p>
                      <p className="text-sm">{invoice.currency}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/10 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Issuer</p>
                      <p className="mt-2 text-sm font-semibold">{invoice.issuerDetails.name}</p>
                      <p className="text-xs text-muted-foreground">{invoice.issuerDetails.reference}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{invoice.issuerDetails.address}</p>
                      <p className="mt-3 text-xs">
                        {invoice.issuerDetails.contact.contactName} · {invoice.issuerDetails.contact.email}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/10 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Debtor</p>
                      <p className="mt-2 text-sm font-semibold">{invoice.debtorDetails.name}</p>
                      <p className="text-xs text-muted-foreground">{invoice.debtorDetails.reference}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{invoice.debtorDetails.address}</p>
                      <p className="mt-3 text-xs">
                        {invoice.debtorDetails.contact.contactName} · {invoice.debtorDetails.contact.email}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Deal Summary</p>
                      {deal && <StatusBadge status={deal.status} />}
                    </div>
                    {deal ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Cash Price</p>
                          <p className="text-base font-semibold">
                            {formatCurrency(deal.cashPrice, invoice.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Discount Amount</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(deal.discountFee, invoice.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Discount Rate</p>
                          <p className="text-sm font-medium">{formatPercent(deal.discountRate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Transaction Fee</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(deal.transactionFee, invoice.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted By</p>
                          <p className="text-sm">{submittedBy || "System"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted At</p>
                          <p className="text-sm">{submittedAt ? formatDateTime(submittedAt) : "-"}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Deal not created yet.</p>
                    )}
                  </div>

                  {canEditDeal && deal && (
                    <div className="border-t border-border/60 pt-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="discountRate">Discount Rate</Label>
                          <Input
                            id="discountRate"
                            type="number"
                            step="0.001"
                            value={dealForm.discountRate}
                            onChange={(e) => setDealForm((prev) => ({ ...prev, discountRate: Number(e.target.value) }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transactionFee">Transaction Fee</Label>
                          <Input
                            id="transactionFee"
                            type="number"
                            step="0.01"
                            value={dealForm.transactionFee}
                            onChange={(e) =>
                              setDealForm((prev) => ({ ...prev, transactionFee: Number(e.target.value) }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sourceSystem">Source System</Label>
                          <Input
                            id="sourceSystem"
                            value={dealForm.sourceSystem}
                            onChange={(e) => setDealForm((prev) => ({ ...prev, sourceSystem: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() =>
                            updateDealMutation.mutate({
                              discountRate: dealForm.discountRate,
                              transactionFee: dealForm.transactionFee,
                              sourceSystem: dealForm.sourceSystem,
                            })
                          }
                          disabled={updateDealMutation.isPending}
                        >
                          {updateDealMutation.isPending ? "Updating..." : "Update Deal"}
                        </Button>
                        <Button onClick={() => submitDealMutation.mutate()} disabled={submitDealMutation.isPending}>
                          {submitDealMutation.isPending ? "Submitting..." : "Submit Deal"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="rounded-2xl border border-border/60 bg-white p-5">
                <div className="pb-4">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Activity Timeline</h2>
                  <p className="text-sm text-muted-foreground">Invoice and deal events in order.</p>
                </div>
                {!timelineItems.length ? (
                  <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                ) : (
                  <div className="space-y-5">
                    {timelineItems.map((item, index) => (
                      <div key={item.id} className="relative pl-6">
                        {index < timelineItems.length - 1 && (
                          <div className="absolute left-0 top-1 h-full w-px bg-border/70" />
                        )}
                        <div className="absolute left-[-5px] top-0 h-3 w-3 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.title.charAt(0).toUpperCase() + item.title.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(item.createdAt)} · {item.actor || "System"}
                          </p>
                          {item.reason && (
                            <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="rounded-2xl border border-border/60 bg-white p-5">
                <div className="pb-4">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Approval Flow</h2>
                  <p className="text-sm text-muted-foreground">Current approvals and comments.</p>
                </div>
                {actionableTask && actionableTask.status === "PENDING_ACTIONABLE" && (
                  <div className="mb-5 rounded-xl bg-muted/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Pending approval</p>
                        <p className="text-xs text-muted-foreground">
                          Level {actionableTask.levelNumber} · {actionableTask.candidateRoles.join(", ")}
                        </p>
                      </div>
                      <StatusBadge status={actionableTask.status} />
                    </div>
                    {isActionBlocked && (
                      <p className="mt-3 text-xs text-amber-700">
                        You have already actioned another approval for this deal and role.
                      </p>
                    )}
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="approval-reason">Comment</Label>
                      <Textarea
                        id="approval-reason"
                        placeholder="Add a comment for this action..."
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        disabled={isActionBlocked}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          taskActionMutation.mutate({
                            taskId: actionableTask.taskId,
                            action: "APPROVE",
                            reason: actionReason,
                          })
                        }
                        disabled={taskActionMutation.isPending || isActionBlocked}
                      >
                        {taskActionMutation.isPending ? "Processing..." : "Approve"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          taskActionMutation.mutate({
                            taskId: actionableTask.taskId,
                            action: "REJECT",
                            reason: actionReason,
                          })
                        }
                        disabled={taskActionMutation.isPending || isActionBlocked}
                      >
                        {taskActionMutation.isPending ? "Processing..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                )}
                {!approvalLevels.length ? (
                  <p className="text-sm text-muted-foreground">No approval tasks yet.</p>
                ) : (
                  <div className="space-y-5">
                    {approvalLevels.map((level, index) => (
                      <div key={level.level} className="relative pl-8">
                        {index < approvalLevels.length - 1 && (
                          <div className="absolute left-3 top-7 h-full w-px bg-border/60" />
                        )}
                        <div
                          className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                            level.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : level.status === "REJECTED"
                                ? "bg-rose-100 text-rose-700"
                                : level.status === "ACTIONABLE"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          L{level.level}
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-muted/10 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Level {level.level}</span>
                            <span className="text-xs text-muted-foreground">
                              {level.status === "APPROVED"
                                ? "Approved"
                                : level.status === "REJECTED"
                                  ? "Rejected"
                                  : level.status === "ACTIONABLE"
                                    ? "Actionable"
                                    : "Blocked"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {level.approvedCount}/{level.total} approvals complete
                          </p>
                          {level.actionableCount > 0 && (
                            <p className="text-xs text-amber-700">
                              {level.actionableCount} actionable · {level.blockedCount} blocked
                            </p>
                          )}
                          {level.rejectedCount > 0 && (
                            <p className="text-xs text-rose-700">{level.rejectedCount} rejected</p>
                          )}
                          {level.actionedBy.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Approved by: {level.actionedBy.join(", ")}
                            </p>
                          )}
                          {level.candidateRoles.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Roles: {level.candidateRoles.join(", ")}
                            </p>
                          )}
                          {level.tasks.some((task) => task.reason) && (
                            <div className="mt-2 space-y-2 rounded-md bg-white/70 p-2">
                              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                                Approval Comments
                              </p>
                              {level.tasks
                                .filter((task) => task.reason)
                                .map((task) => (
                                  <div key={task.taskId} className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      {task.actionedBy || "Reviewer"}
                                    </span>
                                    {task.actionedAt && (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        · {formatDateTime(task.actionedAt)}
                                      </span>
                                    )}
                                    <p className="text-xs text-muted-foreground">{task.reason}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
