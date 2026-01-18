"use client"

import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function WorkflowDetailPage() {
  return (
    <AuthLayout title="Workflow Details">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Workflow details are not currently available from the client. Use approval tasks to progress workflows.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
