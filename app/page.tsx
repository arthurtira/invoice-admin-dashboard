"use client"

import type React from "react"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthLayout } from "@/components/layout/auth-layout"
import { tasksApi } from "@/app/api/tasks"
import { invoicesApi } from "@/app/api/invoices"
import { CheckSquare, Handshake, FileText } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  description: string
  href: string
  icon: React.ReactNode
  isLoading?: boolean
}

function StatCard({ title, value, description, href, icon, isLoading }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "PENDING_ACTIONABLE"],
    queryFn: () => tasksApi.getAll("PENDING_ACTIONABLE"),
  })

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.getAll(),
  })

  const invoices = invoicesData?.data ?? []
  const pendingTasks = tasksData?.length ?? 0
  const pendingDeals = invoices.filter((invoice) => invoice.deal?.status === "SUBMITTED").length
  const pendingInvoices = invoices.filter((invoice) => invoice.status === "REQUIRES_DEAL_INFO").length

  return (
    <AuthLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Overview</h3>
          <p className="text-sm text-muted-foreground">Quick summary of items requiring attention</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Pending Tasks"
            value={pendingTasks}
            description="Tasks awaiting action"
            href="/tasks"
            icon={<CheckSquare className="h-4 w-4" />}
            isLoading={tasksLoading}
          />
          <StatCard
            title="Deals Pending Approval"
            value={pendingDeals}
            description="Deals awaiting approval"
            href="/deals"
            icon={<Handshake className="h-4 w-4" />}
            isLoading={invoicesLoading}
          />
          <StatCard
            title="Invoices Requiring Info"
            value={pendingInvoices}
            description="Invoices needing attention"
            href="/invoices"
            icon={<FileText className="h-4 w-4" />}
            isLoading={invoicesLoading}
          />
        </div>
      </div>
    </AuthLayout>
  )
}
