import { format, formatDistanceToNow } from "date-fns"

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy")
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy HH:mm")
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

export function truncateId(id: string, length = 8): string {
  return id.length > length ? `${id.slice(0, length)}...` : id
}
