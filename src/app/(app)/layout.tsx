'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import toast from 'react-hot-toast'

const menuItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'CAISSIER'] },
  { href: '/ventes', label: 'Ventes', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5.5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5.5a.5.5 0 11-1 0 .5.5 0 011 0z', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/produits', label: 'Produits', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'CAISSIER'] },
  { href: '/stocks', label: 'Stocks', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
  { href: '/caisse', label: 'Caisse', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/production', label: 'Production', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_PRODUCTION'] },
  { href: '/distribution', label: 'Distribution', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1 2 1 2-1 2 1 2-1 2 1zM6 14h.01M8 10h.01M17 13l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_STOCK'] },
  { href: '/livraisons', label: 'Livraisons', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
  { href: '/reservations', label: 'Réservations', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/commandes', label: 'Commandes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/depots', label: 'Dépôts', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
  { href: '/tresorerie', label: 'Trésorerie', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['ADMIN', 'DIRECTION'] },
  { href: '/comptabilite', label: 'Comptabilité', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', roles: ['ADMIN', 'DIRECTION'] },
  { href: '/statistiques', label: 'Statistiques', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', roles: ['ADMIN', 'DIRECTION'] },
  { href: '/rapports', label: 'Rapports', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION'] },
  { href: '/administration/messagerie', label: 'Messagerie', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'CAISSIER'] },
  { href: '/administration/connexions', label: 'Connexions', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', roles: ['ADMIN'] },
  { href: '/administration', label: 'Administration', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: ['ADMIN'] },
  { href: '/points-de-vente', label: 'Points de vente', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
  { href: '/aide', label: 'Aide', icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'CAISSIER'] },
]

const menuGroups = [
  { label: 'Principal', items: ['/dashboard', '/ventes', '/produits', '/stocks', '/caisse'] },
  { label: 'Opérations', items: ['/production', '/distribution', '/livraisons', '/reservations', '/commandes'] },
  { label: 'Données', items: ['/clients', '/clients/credits', '/depots', '/points-de-vente', '/statistiques', '/rapports'] },
  { label: 'Finance', items: ['/tresorerie', '/depenses', '/comptabilite'] },
  { label: 'Système', items: ['/administration/messagerie', '/administration/connexions', '/administration', '/aide'] },
]

function Sidebar({ user, pathname, onNav }: { user: any; pathname: string; onNav: () => void }) {
  const { logout } = useAuth()
  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role))

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-64 bg-gradient-to-b from-lcg-800 to-lcg-900 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo-lcg.jpeg" alt="LCG" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h2 className="font-bold text-white text-sm tracking-tight">LCG Management</h2>
            <p className="text-xs text-blue-200/60">La Congolaise des Glaçons</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {menuGroups.map(group => {
          const groupItems = filteredMenu.filter(item => group.items.includes(item.href))
          if (groupItems.length === 0) return null
          return (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-xs font-semibold text-blue-200/40 uppercase tracking-widest">{group.label}</p>
              <div className="space-y-0.5">
                {groupItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                       isActive(item.href)
                        ? 'bg-white text-lcg-800 shadow-sm'
                        : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={onNav}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
            <span className="text-xs font-bold text-white">{user.firstName[0]}{user.lastName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-blue-200/50 truncate">{user.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-red-300/70 hover:bg-white/10 hover:text-red-300">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

function AlertBell() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchAlerts = async () => {
    const res = await fetch('/api/alerts')
    if (res.ok) setAlerts((await res.json()).alerts || [])
  }

  useEffect(() => { fetchAlerts(); const id = setInterval(fetchAlerts, 30000); return () => clearInterval(id) }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const runCheck = async () => {
    toast.success('Vérification en cours...')
    const res = await fetch('/api/alerts/check', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      toast.success(`${data.created} alerte(s) générée(s)`)
      fetchAlerts()
    }
  }

  const markRead = async () => {
    await fetch('/api/alerts', { method: 'POST' })
    setAlerts([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] min-h-[18px] leading-none">
            {alerts.length > 9 ? '9+' : alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Alertes ({alerts.length})</h3>
            <div className="flex gap-2">
              <button onClick={runCheck} className="text-xs text-lcg-600 hover:underline">Vérifier</button>
              {alerts.length > 0 && <button onClick={markRead} className="text-xs text-gray-400 hover:underline">Tout lu</button>}
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">Aucune alerte</div>
            ) : (
              alerts.map((a: any) => (
                <Link
                  key={a.id}
                  href={a.link || '#'}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${a.severity === 'CRITICAL' ? 'bg-red-500' : a.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm text-gray-700">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader-spinner h-10 w-10" />
      </div>
    )
  }

  const showBackButton = pathname !== '/dashboard'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-lcg-700 text-white p-2.5 rounded-xl shadow-lg hover:bg-lcg-600 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar user={user} pathname={pathname} onNav={() => {}} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar user={user} pathname={pathname} onNav={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <main className="flex-1 min-h-screen overflow-auto">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 lg:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
  { href: '/depots', label: 'Dépôts', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
  { href: '/depenses', label: 'Dépenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', roles: ['ADMIN', 'DIRECTION'] },
              { href: '/points-de-vente', label: 'Points de vente', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
  { href: '/clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
  { href: '/clients/credits', label: 'Créances', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['ADMIN', 'DIRECTION'] },
  { href: '/rapports', label: 'Rapports', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION'] },
  { href: '/comptabilite', label: 'Comptabilité', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', roles: ['ADMIN', 'DIRECTION'] },
              { href: '/administration/messagerie', label: 'Messagerie', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'CAISSIER'] },
              { href: '/administration', label: 'Admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: ['ADMIN'] },
              { href: '/aide', label: 'Aide', icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'CAISSIER'] },
            ].filter(item => item.roles.includes(user?.role || '')).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-lcg-600 hover:bg-lcg-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
          <AlertBell />
        </div>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {showBackButton && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-lcg-600 transition-colors mb-4 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour au tableau de bord
            </Link>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
