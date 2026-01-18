"use client"

import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { invoicesApi } from "@/app/api/invoices"
import { getApiErrorMessage } from "@/app/api/client"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceCreateRequest } from "@/app/types"

const steps = [
  { id: "basics", name: "Invoice Basics", description: "Core details for the invoice." },
  { id: "issuer", name: "Issuer Details", description: "Seller and issuer contact details." },
  { id: "debtor", name: "Debtor Details", description: "Debtor contact and reference details." },
  { id: "review", name: "Review", description: "Confirm and submit." },
]

function useInvoiceDraft() {
  const [draft, setDraft] = useState<InvoiceCreateRequest>({
    invoiceNumber: "",
    externalInvoiceRef: "",
    sellerRef: "",
    debtorRef: "",
    invoiceAmount: 0,
    currency: "USD",
    issueDate: "",
    dueDate: "",
    tenorDays: 0,
    documentRef: "",
    issuerDetails: {
      name: "",
      reference: "",
      address: "",
      contact: { contactName: "", email: "", phone: "" },
    },
    debtorDetails: {
      name: "",
      reference: "",
      address: "",
      contact: { contactName: "", email: "", phone: "" },
    },
  })

  return { draft, setDraft }
}

export default function NewInvoicePage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState("")
  const { draft, setDraft } = useInvoiceDraft()
  const { toast } = useToast()
  const router = useRouter()

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex])

  const createMutation = useMutation({
    mutationFn: (payload: InvoiceCreateRequest) => invoicesApi.create(payload),
    onSuccess: (response) => {
      toast({
        title: "Invoice created",
        description: response.data.dealCreated ? "Deal created with invoice." : "Invoice created.",
      })
      router.push(`/invoices/${response.data.invoice.id}`)
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const validateStep = () => {
    if (stepIndex === 0) {
      if (!draft.invoiceNumber || !draft.issueDate || !draft.dueDate) {
        return "Invoice number, issue date, and due date are required."
      }
      if (!draft.currency || draft.invoiceAmount <= 0) {
        return "Currency and a positive invoice amount are required."
      }
    }

    if (stepIndex === 1) {
      if (!draft.issuerDetails.name || !draft.issuerDetails.reference) {
        return "Issuer name and reference are required."
      }
    }

    if (stepIndex === 2) {
      if (!draft.debtorDetails.name || !draft.debtorDetails.reference) {
        return "Debtor name and reference are required."
      }
    }

    return ""
  }

  const handleNext = () => {
    const validationError = validateStep()
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setError("")
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = () => {
    const validationError = validateStep()
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    createMutation.mutate({
      ...draft,
      sellerRef: draft.issuerDetails.reference,
      debtorRef: draft.debtorDetails.reference,
      externalInvoiceRef: draft.externalInvoiceRef?.trim() || undefined,
      discountRateOverrides: null,
    })
  }

  return (
    <AuthLayout title="New Invoice">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-xl border border-border bg-muted/20 p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs uppercase">
                Create Invoice
              </Badge>
              <p className="text-sm text-muted-foreground">{steps[stepIndex].description}</p>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">{steps[stepIndex].name}</h3>
              <span className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Card className="self-start lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Flow</CardTitle>
              <CardDescription>Follow the steps to capture data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      index === stepIndex
                        ? "bg-primary text-primary-foreground"
                        : index < stepIndex
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{steps[stepIndex].name}</CardTitle>
              <CardDescription>{steps[stepIndex].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {stepIndex === 0 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Invoice details</p>
                        <p className="text-xs text-muted-foreground">Numbers and currency for this invoice.</p>
                      </div>
                      <Badge variant="secondary" className="text-xs uppercase">
                        Required
                      </Badge>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input
                          id="invoiceNumber"
                          value={draft.invoiceNumber}
                          onChange={(e) => setDraft((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="externalInvoiceRef">External Invoice Ref</Label>
                        <Input
                          id="externalInvoiceRef"
                          value={draft.externalInvoiceRef || ""}
                          onChange={(e) => setDraft((prev) => ({ ...prev, externalInvoiceRef: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoiceAmount">Invoice Amount</Label>
                        <Input
                          id="invoiceAmount"
                          type="number"
                          value={draft.invoiceAmount}
                          onChange={(e) => setDraft((prev) => ({ ...prev, invoiceAmount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          value={draft.currency}
                          onChange={(e) => setDraft((prev) => ({ ...prev, currency: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div>
                      <p className="text-sm font-semibold">Dates and terms</p>
                      <p className="text-xs text-muted-foreground">Issue date, due date, and tenor.</p>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="issueDate">Issue Date</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={draft.issueDate}
                          onChange={(e) => setDraft((prev) => ({ ...prev, issueDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={draft.dueDate}
                          onChange={(e) => setDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenorDays">Tenor Days</Label>
                        <Input
                          id="tenorDays"
                          type="number"
                          value={draft.tenorDays}
                          onChange={(e) => setDraft((prev) => ({ ...prev, tenorDays: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div>
                      <p className="text-sm font-semibold">Supporting documents</p>
                      <p className="text-xs text-muted-foreground">Optional references for this invoice.</p>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="documentRef">Document Ref</Label>
                        <Input
                          id="documentRef"
                          value={draft.documentRef}
                          onChange={(e) => setDraft((prev) => ({ ...prev, documentRef: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stepIndex === 1 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div>
                      <p className="text-sm font-semibold">Issuer Details</p>
                      <p className="text-xs text-muted-foreground">Primary issuer information and contacts.</p>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="issuerName">Name</Label>
                        <Input
                          id="issuerName"
                          value={draft.issuerDetails.name}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              issuerDetails: { ...prev.issuerDetails, name: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issuerReference">Reference</Label>
                        <Input
                          id="issuerReference"
                          value={draft.issuerDetails.reference}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              issuerDetails: { ...prev.issuerDetails, reference: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="issuerAddress">Address</Label>
                        <Textarea
                          id="issuerAddress"
                          value={draft.issuerDetails.address}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              issuerDetails: { ...prev.issuerDetails, address: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issuerContactName">Contact Name</Label>
                        <Input
                          id="issuerContactName"
                          value={draft.issuerDetails.contact.contactName}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              issuerDetails: {
                                ...prev.issuerDetails,
                                contact: { ...prev.issuerDetails.contact, contactName: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issuerContactPhone">Contact Phone</Label>
                        <Input
                          id="issuerContactPhone"
                          value={draft.issuerDetails.contact.phone}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              issuerDetails: {
                                ...prev.issuerDetails,
                                contact: { ...prev.issuerDetails.contact, phone: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="issuerContactEmail">Contact Email</Label>
                        <Input
                          id="issuerContactEmail"
                          type="email"
                          value={draft.issuerDetails.contact.email}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              issuerDetails: {
                                ...prev.issuerDetails,
                                contact: { ...prev.issuerDetails.contact, email: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stepIndex === 2 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div>
                      <p className="text-sm font-semibold">Debtor Details</p>
                      <p className="text-xs text-muted-foreground">Who is receiving this invoice.</p>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="debtorName">Name</Label>
                        <Input
                          id="debtorName"
                          value={draft.debtorDetails.name}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              debtorDetails: { ...prev.debtorDetails, name: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="debtorReference">Reference</Label>
                        <Input
                          id="debtorReference"
                          value={draft.debtorDetails.reference}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              debtorDetails: { ...prev.debtorDetails, reference: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="debtorAddress">Address</Label>
                        <Textarea
                          id="debtorAddress"
                          value={draft.debtorDetails.address}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              debtorDetails: { ...prev.debtorDetails, address: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="debtorContactName">Contact Name</Label>
                        <Input
                          id="debtorContactName"
                          value={draft.debtorDetails.contact.contactName}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              debtorDetails: {
                                ...prev.debtorDetails,
                                contact: { ...prev.debtorDetails.contact, contactName: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="debtorContactPhone">Contact Phone</Label>
                        <Input
                          id="debtorContactPhone"
                          value={draft.debtorDetails.contact.phone}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              debtorDetails: {
                                ...prev.debtorDetails,
                                contact: { ...prev.debtorDetails.contact, phone: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="debtorContactEmail">Contact Email</Label>
                        <Input
                          id="debtorContactEmail"
                          type="email"
                          value={draft.debtorDetails.contact.email}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              debtorDetails: {
                                ...prev.debtorDetails,
                                contact: { ...prev.debtorDetails.contact, email: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stepIndex === 3 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <p className="text-sm font-semibold">Invoice Summary</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Invoice Number</p>
                        <p className="font-medium">{draft.invoiceNumber || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">External Ref</p>
                        <p className="font-medium">{draft.externalInvoiceRef || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Seller Ref</p>
                        <p className="font-medium">{draft.issuerDetails.reference || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Debtor Ref</p>
                        <p className="font-medium">{draft.debtorDetails.reference || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-medium">{draft.invoiceAmount} {draft.currency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tenor</p>
                        <p className="font-medium">{draft.tenorDays} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Issue Date</p>
                        <p className="font-medium">{draft.issueDate || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="font-medium">{draft.dueDate || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border bg-muted/20 p-5">
                      <p className="text-sm font-semibold">Issuer</p>
                      <p className="mt-2 text-sm text-muted-foreground">{draft.issuerDetails.name || "-"}</p>
                      <p className="text-xs text-muted-foreground">{draft.issuerDetails.address || "-"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-5">
                      <p className="text-sm font-semibold">Debtor</p>
                      <p className="mt-2 text-sm text-muted-foreground">{draft.debtorDetails.name || "-"}</p>
                      <p className="text-xs text-muted-foreground">{draft.debtorDetails.address || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => router.push("/invoices")}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  {stepIndex > 0 && (
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                  )}
                  {stepIndex < steps.length - 1 ? (
                    <Button onClick={handleNext}>Continue</Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Submitting..." : "Create Invoice"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  )
}
