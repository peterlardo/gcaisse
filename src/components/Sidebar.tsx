'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

const menuItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: '📊', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'CAISSIER'] },
  { href: '/ventes', label: 'Ventes', icon: '💵', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/produits', label: 'Produits', icon: '🧊', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'CAISSIER'] },
  { href: '/stocks', label: 'Stocks', icon: '📦', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
  { href: '/caisse', label: 'Caisse', icon: '💰', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/production', label: 'Production', icon: '🏭', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_PRODUCTION'] },
  { href: '/distribution', label: 'Distribution', icon: '🚚', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_STOCK'] },
  { href: '/reservations', label: 'Réservations', icon: '📅', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/commandes', label: 'Commandes', icon: '📋', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/clients', label: 'Clients', icon: '👤', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/statistiques', label: 'Statistiques', icon: '📈', roles: ['ADMIN', 'DIRECTION'] },
  { href: '/rapports', label: 'Rapports', icon: '📄', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION'] },
  { href: '/administration', label: 'Administration', icon: '⚙️', roles: ['ADMIN'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role))

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 btn-primary p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lcg-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">LCG</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">LCG</h2>
              <p className="text-xs text-gray-500">La Congolaise des Glaçons</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{user.firstName[0]}{user.lastName[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="sidebar-link sidebar-link-inactive w-full mt-1 text-red-600 hover:bg-red-50">
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}
