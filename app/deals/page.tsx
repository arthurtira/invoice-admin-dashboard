"use client"

import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DealsPage() {
  return (
    <AuthLayout title="Deals">
      <Card>
        <CardHeader>
          <CardTitle>Deals Are Invoice-Scoped</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Deals are managed as a sub-resource of invoices. Open an invoice to review, update, or submit its deal.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
