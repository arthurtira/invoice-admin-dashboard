"use client"

import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DealDetailPage() {
  return (
    <AuthLayout title="Deal Details">
      <Card>
        <CardHeader>
          <CardTitle>Deals Are Invoice-Scoped</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Deal details are accessed from the invoice view. Open the invoice to update or submit the deal.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
