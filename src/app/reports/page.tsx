'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { formatVND } from '@/lib/utils'

const COLORS = ['#10b981', '#f43f5e', '#8b5cf6', '#f59e0b']

export default function ReportsPage() {
  const [data, setData] = useState<{ chartData: Array<{ name: string; revenue: number; cost: number; labor: number }>; summary: { totalRevenue: number; totalCost: number; totalLabor: number; profit: number } } | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetch(`/api/dashboard?year=${year}`)
      .then(r => r.json())
      .then(setData)
  }, [year])

  const profitData = data?.chartData.map(m => ({
    ...m,
    profit: m.revenue - m.cost - m.labor,
  })) || []

  const pieData = data ? [
    { name: 'Doanh thu', value: data.summary.totalRevenue },
    { name: 'Chi phí NVL', value: data.summary.totalCost },
    { name: 'Nhân công', value: data.summary.totalLabor },
    { name: 'Lợi nhuận', value: Math.max(0, data.summary.profit) },
  ] : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>Báo cáo tài chính</h1>
          <p className="text-slate-500 text-sm mt-0.5">Phân tích lợi nhuận và cơ cấu chi phí</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400">
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Profit Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Lợi nhuận theo tháng</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${v}`} />
              <Tooltip formatter={(value: number) => formatVND(value)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="cost" name="Chi phí" fill="#f43f5e" radius={[3,3,0,0]} />
              <Bar dataKey="labor" name="Nhân công" fill="#8b5cf6" radius={[3,3,0,0]} />
              <Bar dataKey="profit" name="Lợi nhuận" fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Cơ cấu tài chính năm {year}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                dataKey="value" nameKey="name" paddingAngle={3}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatVND(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLORS[i] }} />
                <span>{item.name}:</span>
                <span className="font-semibold">{formatVND(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
