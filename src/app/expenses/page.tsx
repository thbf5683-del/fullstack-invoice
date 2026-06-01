'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, X, Check, Users } from 'lucide-react'
import { formatVND, formatMonth } from '@/lib/utils'
import clsx from 'clsx'

interface Expense {
  _id: string
  month: number
  year: number
  employeeName: string
  position: string
  department: string
  baseSalary: number
  overtime: number
  bonus: number
  deductions: number
  netSalary: number
  status: 'pending' | 'paid'
  notes?: string
}

const CURRENT = new Date()
const EMPTY_FORM = () => ({
  month: CURRENT.getMonth() + 1,
  year: CURRENT.getFullYear(),
  employeeName: '',
  position: '',
  department: 'Sản xuất',
  baseSalary: 0,
  overtime: 0,
  bonus: 0,
  deductions: 0,
  status: 'pending' as const,
  notes: '',
})

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<{ totalNet?: number; totalBase?: number; count?: number }>({})
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(CURRENT.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(CURRENT.getFullYear())
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState(EMPTY_FORM())
  const [saving, setSaving] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ month: String(filterMonth), year: String(filterYear), limit: '100' })
    try {
      const res = await fetch(`/api/expenses?${params}`)
      const json = await res.json()
      setExpenses(json.data || [])
      setSummary(json.summary || {})
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterYear])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM()); setShowModal(true) }
  const openEdit = (exp: Expense) => { setEditing(exp); setForm({ ...exp }); setShowModal(true) }
  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xoá?')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    fetchExpenses()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editing ? `/api/expenses/${editing._id}` : '/api/expenses'
      const method = editing ? 'PUT' : 'POST'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setShowModal(false)
      fetchExpenses()
    } finally {
      setSaving(false)
    }
  }

  const net = (form.baseSalary || 0) + (form.overtime || 0) + (form.bonus || 0) - (form.deductions || 0)

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
  const YEARS = [CURRENT.getFullYear(), CURRENT.getFullYear() - 1, CURRENT.getFullYear() - 2]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>Chi phí nhân công</h1>
          <p className="text-slate-500 text-sm mt-0.5">{formatMonth(filterMonth, filterYear)}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-violet-200 transition-colors">
          <Plus size={16} /> Thêm nhân công
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng lương thực lĩnh', value: formatVND(summary.totalNet || 0), color: 'bg-violet-50 text-violet-600' },
          { label: 'Tổng lương cơ bản', value: formatVND(summary.totalBase || 0), color: 'bg-sky-50 text-sky-600' },
          { label: 'Số nhân viên', value: `${summary.count || 0} người`, color: 'bg-emerald-50 text-emerald-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2', c.color)}>{c.label}</div>
            <p className="text-xl font-bold text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
          {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
              <th className="text-left px-5 py-3">Nhân viên</th>
              <th className="text-left px-4 py-3">Chức vụ</th>
              <th className="text-left px-4 py-3">Bộ phận</th>
              <th className="text-right px-4 py-3">Lương CB</th>
              <th className="text-right px-4 py-3">Tăng ca</th>
              <th className="text-right px-4 py-3">Thưởng</th>
              <th className="text-right px-4 py-3">Khấu trừ</th>
              <th className="text-right px-4 py-3">Thực lĩnh</th>
              <th className="text-center px-4 py-3">TT</th>
              <th className="text-right px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && Array(5).fill(0).map((_, i) => (
              <tr key={i} className="border-t border-slate-50">
                {Array(10).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}
              </tr>
            ))}
            {!loading && expenses.map(exp => (
              <tr key={exp._id} className="border-t border-slate-50 table-row-hover">
                <td className="px-5 py-3 font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                    {exp.employeeName[0]?.toUpperCase()}
                  </div>
                  {exp.employeeName}
                </td>
                <td className="px-4 py-3 text-slate-500">{exp.position}</td>
                <td className="px-4 py-3 text-slate-500">{exp.department}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatVND(exp.baseSalary)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{exp.overtime ? `+${formatVND(exp.overtime)}` : '—'}</td>
                <td className="px-4 py-3 text-right text-sky-600">{exp.bonus ? `+${formatVND(exp.bonus)}` : '—'}</td>
                <td className="px-4 py-3 text-right text-rose-500">{exp.deductions ? `-${formatVND(exp.deductions)}` : '—'}</td>
                <td className="px-4 py-3 text-right font-bold text-violet-700">{formatVND(exp.netSalary)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                    exp.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                  )}>
                    {exp.status === 'paid' ? 'Đã trả' : 'Chờ'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(exp)} className="p-1.5 hover:bg-violet-50 rounded-lg text-slate-400 hover:text-violet-500 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(exp._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !expenses.length && (
              <tr>
                <td colSpan={10} className="px-5 py-16 text-center text-slate-400">
                  <Users size={40} className="mx-auto mb-3 text-slate-200" />
                  <p>Chưa có dữ liệu nhân công tháng này</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">{editing ? 'Sửa thông tin lương' : 'Thêm nhân công'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tháng</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Năm</label>
                  <select value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Họ tên nhân viên</label>
                  <input value={form.employeeName} onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Chức vụ</label>
                  <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bộ phận</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Trạng thái</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'pending' | 'paid' }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    <option value="pending">Chờ thanh toán</option>
                    <option value="paid">Đã trả</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Lương cơ bản (đ)', field: 'baseSalary' as const },
                  { label: 'Tăng ca (đ)', field: 'overtime' as const },
                  { label: 'Thưởng (đ)', field: 'bonus' as const },
                  { label: 'Khấu trừ (đ)', field: 'deductions' as const },
                ].map(f => (
                  <div key={f.field}>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{f.label}</label>
                    <input type="number" value={form[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                ))}
              </div>
              <div className="bg-violet-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-violet-700 font-medium">Thực lĩnh:</span>
                <span className="text-lg font-bold text-violet-700">{formatVND(net)}</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-60 transition-colors">
                <Check size={15} />
                {editing ? 'Lưu' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
