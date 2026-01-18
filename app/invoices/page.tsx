"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { invoicesApi } from "@/app/api/invoices"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Invoice } from "@/app/types"

export default function InvoicesPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.getAll(),
  })

  const invoices = useMemo(() => data?.data ?? [], [data])

  const columns = [
    {
      header: "External Invoice ID",
      cell: (invoice: Invoice) => <span className="font-mono text-sm">{invoice.externalInvoiceId}</span>,
    },
    {
      header: "Amount",
      cell: (invoice: Invoice) => formatCurrency(invoice.invoiceAmount, invoice.currency),
    },
    {
      header: "Currency",
      accessorKey: "currency" as const,
    },
    {
      header: "Tenor",
      cell: (invoice: Invoice) => `${invoice.tenorDays} days`,
    },
    {
      header: "Status",
      cell: (invoice: Invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      header: "Created",
      cell: (invoice: Invoice) => formatDate(invoice.createdAt),
    },
  ]

  return (
    <AuthLayout title="Invoices">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">All Invoices</h3>
            <p className="text-sm text-muted-foreground">Click on a row to view invoice details</p>
          </div>
          <Button onClick={() => router.push("/invoices/new")}>New Invoice</Button>
        </div>

        <DataTable
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          emptyMessage="No invoices found"
          onRowClick={(invoice) => router.push(`/invoices/${invoice.id}`)}
        />
      </div>
    </AuthLayout>
  )
}
