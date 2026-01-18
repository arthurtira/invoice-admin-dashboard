"use client"

import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PricingPolicyDetailPage() {
  return (
    <AuthLayout title="Pricing Rule Details" requireAdmin>
      <Card>
        <CardHeader>
          <CardTitle>Pricing Rule Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pricing rules are managed from the main pricing rules page. Direct detail views are not available.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
