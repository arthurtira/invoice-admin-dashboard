import { AuthLayout } from "@/components/layout/auth-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuditPage() {
  return (
    <AuthLayout title="Audit Log">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Audit endpoints are not wired for this environment.</p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
