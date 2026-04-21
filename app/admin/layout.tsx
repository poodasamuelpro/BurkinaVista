/**
 * app/admin/layout.tsx — Layout admin
 * Vérifie le cookie JWT (géré par middleware.ts)
 * Le middleware redirige automatiquement si pas connecté
 */
'use client'
import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  return (
    <div className="min-h-screen flex bg-faso-night">
      {!isLoginPage && <AdminSidebar />}

      <main className={`flex-1 overflow-x-hidden ${
        isLoginPage ? '' : 'lg:ml-64 p-4 lg:p-8 pt-16'
      }`}>
        {children}
      </main>
    </div>
  )
}