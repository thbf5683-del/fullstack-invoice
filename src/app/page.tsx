'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, FileText, RefreshCw,
} from 'lucide-react'
import { formatVND, formatDate, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import clsx from 'clsx'

interface DashboardData {
  summary: {
    totalRevenue: number
    totalCost: number
    totalLabor: number
    profit: number
    revenueCount: number
    costCount: number
    laborCount: number
    pendingRevenue: number
    pendingCost: number
  }
  chartData: Array<{ name: string; revenue: number; cost: number; labor: number }>
  recentInvoices: Array<{
    _id: string
    invoiceNumber: string
    type: string
    partner: string
    total: number
    status: string
    date: string
  }>
}

const CURRENT_YEAR = new Date().getFullYear()

function StatCard({
  title, value, sub, icon: Icon, color, trend,
}: {
  title: string
  value: string
  sub: string
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-fade-up">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={clsx('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
            trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
          )}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : null}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Sora,sans-serif' }}>{value}</p>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-medium text-slate-700">{formatVND(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(CURRENT_YEAR)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?year=${year}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [year])

  const s = data?.summary

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>
            Tổng quan
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Số liệu tài chính tổng hợp</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-sky-600 hover:border-sky-300 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Doanh thu (đầu ra)"
          value={loading ? '...' : formatVND(s?.totalRevenue || 0)}
          sub={`${s?.revenueCount || 0} hóa đơn • Chờ: ${formatVND(s?.pendingRevenue || 0)}`}
          icon={TrendingUp}
          color="bg-emerald-100 text-emerald-600"
          trend="up"
        />
        <StatCard
          title="Chi phí (đầu vào)"
          value={loading ? '...' : formatVND(s?.totalCost || 0)}
          sub={`${s?.costCount || 0} hóa đơn • Chờ: ${formatVND(s?.pendingCost || 0)}`}
          icon={TrendingDown}
          color="bg-rose-100 text-rose-600"
          trend="down"
        />
        <StatCard
          title="Chi phí nhân công"
          value={loading ? '...' : formatVND(s?.totalLabor || 0)}
          sub={`${s?.laborCount || 0} bản ghi lương`}
          icon={Users}
          color="bg-violet-100 text-violet-600"
          trend="neutral"
        />
        <StatCard
          title="Lợi nhuận ước tính"
          value={loading ? '...' : formatVND(s?.profit || 0)}
          sub="Doanh thu - Chi phí - Nhân công"
          icon={DollarSign}
          color={s?.profit && s.profit >= 0 ? 'bg-sky-100 text-sky-600' : 'bg-orange-100 text-orange-600'}
          trend={s?.profit !== undefined ? (s.profit >= 0 ? 'up' : 'down') : 'neutral'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Area Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Biến động tài chính theo tháng</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data?.chartData || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" fill="url(#gRevenue)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="cost" name="Chi phí" stroke="#f43f5e" fill="url(#gCost)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="labor" name="Nhân công" stroke="#8b5cf6" fill="none" strokeWidth={2} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Chi phí nhân công / tháng</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.chartData || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="labor" name="Nhân công" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-700 text-sm">Hóa đơn gần đây</h2>
          </div>
          <a href="/invoices/output" className="text-xs text-sky-500 hover:text-sky-600 font-medium">
            Xem tất cả →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                <th className="text-left px-5 py-3">Số hóa đơn</th>
                <th className="text-left px-4 py-3">Loại</th>
                <th className="text-left px-4 py-3">Đối tác</th>
                <th className="text-left px-4 py-3">Ngày</th>
                <th className="text-right px-4 py-3">Tổng tiền</th>
                <th className="text-center px-5 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array(5).fill(0).map((_, i) => (
                <tr key={i} className="border-t border-slate-50">
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 skeleton rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && (data?.recentInvoices || []).map(inv => (
                <tr key={inv._id} className="border-t border-slate-50 table-row-hover">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-md font-medium',
                      inv.type === 'input' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {inv.type === 'input' ? '▼ Đầu vào' : '▲ Đầu ra'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{inv.partner}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatVND(inv.total)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLORS[inv.status])}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && !data?.recentInvoices?.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Chưa có hóa đơn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
