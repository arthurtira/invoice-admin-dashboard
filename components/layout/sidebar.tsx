"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, CheckSquare, Settings, DollarSign, Shield, KeySquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthContext } from "@/app/context/auth-context"

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/tasks", label: "Approval Tasks", icon: CheckSquare },
]

const adminNavItems = [
  { href: "/admin/approval-rules", label: "Approval Rules", icon: Settings },
  { href: "/admin/pricing-policies", label: "Pricing Rules", icon: DollarSign },
  { href: "/admin/roles", label: "Roles", icon: Shield },
  { href: "/admin/permissions", label: "Permissions", icon: KeySquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin } = useAuthContext()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <h1 className="text-lg font-semibold text-sidebar-foreground">Invoice Admin</h1>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {isAdmin && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}
