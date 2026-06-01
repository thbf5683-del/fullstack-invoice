import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Quản Lý Hóa Đơn',
  description: 'Hệ thống quản lý hóa đơn đầu vào, đầu ra và chi phí nhân công',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
