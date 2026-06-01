export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatMonth(month: number, year: number): string {
  return `Tháng ${month}/${year}`
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  cancelled: 'Đã huỷ',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'badge-draft',
  pending: 'badge-pending',
  paid: 'badge-paid',
  cancelled: 'badge-cancelled',
}

export function generateInvoiceNumber(type: 'input' | 'output'): string {
  const prefix = type === 'input' ? 'IN' : 'OUT'
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `${prefix}-${y}${m}-${rand}`
}
