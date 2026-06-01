'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileDown,
  FileUp,
  Users,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices/input', label: 'Hóa đơn đầu vào', icon: FileDown },
  { href: '/invoices/output', label: 'Hóa đơn đầu ra', icon: FileUp },
  { href: '/expenses', label: 'Chi phí nhân công', icon: Users },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              InvoiceHub
            </p>
            <p className="text-slate-400 text-xs">Quản lý hóa đơn</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={18} className={active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-sky-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs text-center">© 2024 InvoiceHub</p>
      </div>
    </aside>
  )
}
