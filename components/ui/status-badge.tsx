import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  CLAIMED: "bg-blue-100 text-blue-800 border-blue-200",
  DRAFT: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  INACTIVE: "bg-muted text-muted-foreground border-border",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || "bg-muted text-muted-foreground border-border"

  return (
    <Badge variant="outline" className={cn("border font-medium", colorClass, className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  )
}
