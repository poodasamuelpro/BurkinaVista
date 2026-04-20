/**
 * app/admin/layout.tsx — Layout admin
 * Vérifie le cookie JWT (géré par middleware.ts)
 * Le middleware redirige automatiquement si pas connecté
 */
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'Administration — BurkinaVista',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-16 flex bg-faso-night">
      {/* Sidebar desktop */}
      <AdminSidebar />

      {/* Contenu principal */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
