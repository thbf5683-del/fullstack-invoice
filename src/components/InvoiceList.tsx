'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, X, ChevronDown, Check } from 'lucide-react'
import { formatVND, formatDate, STATUS_LABELS, STATUS_COLORS, generateInvoiceNumber } from '@/lib/utils'
import clsx from 'clsx'

interface InvoiceItem { name: string; quantity: number; unit: string; unitPrice: number; amount: number }
interface Invoice {
  _id: string
  invoiceNumber: string
  type: 'input' | 'output'
  date: string
  partner: string
  description: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  taxAmount: number
  total: number
  status: string
  notes?: string
}

const EMPTY_ITEM: InvoiceItem = { name: '', quantity: 1, unit: 'cái', amount: 0, unitPrice: 0 }

const EMPTY_FORM = (type: 'input' | 'output') => ({
  type,
  invoiceNumber: generateInvoiceNumber(type),
  date: new Date().toISOString().slice(0, 10),
  partner: '',
  description: '',
  items: [{ ...EMPTY_ITEM }],
  tax: 10,
  status: 'pending',
  notes: '',
})

export default function InvoiceList({ type }: { type: 'input' | 'output' }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [form, setForm] = useState<ReturnType<typeof EMPTY_FORM>>(EMPTY_FORM(type))
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 15

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ type, page: String(page), limit: String(LIMIT) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/invoices?${params}`)
      const json = await res.json()
      setInvoices(json.data || [])
      setTotal(json.pagination?.total || 0)
    } finally {
      setLoading(false)
    }
  }, [type, page, search, statusFilter])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM(type))
    setShowModal(true)
  }

  const openEdit = (inv: Invoice) => {
    setEditing(inv)
    setForm({ ...inv, date: inv.date.slice(0, 10) } as ReturnType<typeof EMPTY_FORM>)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xoá hóa đơn này?')) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    fetchInvoices()
  }

  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      items[i].amount = Number(items[i].quantity) * Number(items[i].unitPrice)
    }
    setForm(f => ({ ...f, items }))
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editing ? `/api/invoices/${editing._id}` : '/api/invoices'
      const method = editing ? 'PUT' : 'POST'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setShowModal(false)
      fetchInvoices()
    } finally {
      setSaving(false)
    }
  }

  const subtotal = form.items.reduce((s, i) => s + (i.amount || 0), 0)
  const taxAmount = (subtotal * form.tax) / 100
  const total_calc = subtotal + taxAmount

  const typeLabel = type === 'input' ? 'Hóa đơn đầu vào' : 'Hóa đơn đầu ra'
  const partnerLabel = type === 'input' ? 'Nhà cung cấp' : 'Khách hàng'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>
            {typeLabel}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} hóa đơn tổng cộng</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-sky-200 transition-colors"
        >
          <Plus size={16} />
          Tạo hóa đơn
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm kiếm hóa đơn..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                <th className="text-left px-5 py-3">Số HĐ</th>
                <th className="text-left px-4 py-3">{partnerLabel}</th>
                <th className="text-left px-4 py-3">Ngày</th>
                <th className="text-left px-4 py-3">Mô tả</th>
                <th className="text-right px-4 py-3">Tổng tiền</th>
                <th className="text-center px-4 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array(6).fill(0).map((_, i) => (
                <tr key={i} className="border-t border-slate-50">
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 skeleton rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && invoices.map(inv => (
                <tr key={inv._id} className="border-t border-slate-50 table-row-hover transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-sky-600 font-semibold">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{inv.partner}</td>
                  <td className="px-4 py-3.5 text-slate-500">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">{inv.description || '—'}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{formatVND(inv.total)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLORS[inv.status])}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(inv)} className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-400 hover:text-sky-500 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(inv._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !invoices.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    <div className="text-4xl mb-3">📄</div>
                    <p>Chưa có hóa đơn nào</p>
                    <button onClick={openCreate} className="mt-3 text-sky-500 text-sm hover:underline">
                      Tạo hóa đơn đầu tiên
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > LIMIT && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Hiển thị {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >← Trước</button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * LIMIT >= total}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >Sau →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Sora,sans-serif' }}>
                {editing ? 'Sửa hóa đơn' : `Tạo ${typeLabel}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Số hóa đơn</label>
                  <input
                    value={form.invoiceNumber}
                    onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ngày</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{partnerLabel}</label>
                  <input
                    value={form.partner}
                    onChange={e => setForm(f => ({ ...f, partner: e.target.value }))}
                    placeholder={`Nhập tên ${partnerLabel.toLowerCase()}`}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Mô tả</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả nội dung hóa đơn"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500">Danh mục hàng hoá / dịch vụ</label>
                  <button onClick={addItem} className="text-xs text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1">
                    <Plus size={13} /> Thêm dòng
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 font-semibold">
                        <th className="text-left px-3 py-2">Tên hàng</th>
                        <th className="text-right px-3 py-2 w-20">SL</th>
                        <th className="text-left px-3 py-2 w-20">ĐVT</th>
                        <th className="text-right px-3 py-2 w-28">Đơn giá</th>
                        <th className="text-right px-3 py-2 w-28">Thành tiền</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-2 py-1.5">
                            <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)}
                              placeholder="Tên hàng hoá"
                              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-sky-400" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-sky-400" />
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold text-slate-700">
                            {formatVND(item.amount)}
                          </td>
                          <td className="px-1 py-1.5">
                            {form.items.length > 1 && (
                              <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-400 p-1">
                                <X size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Tạm tính:</span><span>{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 items-center">
                    <span className="flex items-center gap-1">
                      Thuế VAT
                      <input type="number" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: Number(e.target.value) }))}
                        className="w-12 border border-slate-200 rounded px-1 py-0.5 text-xs text-center" />%:
                    </span>
                    <span>{formatVND(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                    <span>Tổng cộng:</span><span className="text-sky-600">{formatVND(total_calc)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-60 transition-colors"
              >
                {saving ? <RefreshCwIcon /> : <Check size={15} />}
                {editing ? 'Lưu thay đổi' : 'Tạo hóa đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RefreshCwIcon() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M3 22v-6h6"/>
      <path d="M21 12a9 9 0 01-15 6.7L3 16"/>
    </svg>
  )
}
