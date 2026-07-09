'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function AdminPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (user?.role !== 'ADMIN') {
    return <div className="text-center py-12"><p className="text-gray-500 font-medium">Accès réservé à l'administrateur</p></div>
  }

  const modules = [
    { href: '/administration/messagerie', label: 'Messagerie', desc: 'Messages internes', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', color: 'bg-blue-50 text-blue-600' },
    { href: '/administration/connexions', label: 'Connexions', desc: 'Historique des connexions', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'bg-purple-50 text-purple-600' },
    { href: '/admin/users', label: 'Utilisateurs', desc: 'Gestion des utilisateurs', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', color: 'bg-emerald-50 text-emerald-600' },
    { href: '/depenses', label: 'Dépenses', desc: 'Gestion des charges', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-red-50 text-red-600' },
    { href: '/tresorerie', label: 'Trésorerie', desc: 'Flux financiers', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-lcg-50 text-lcg-600' },
    { href: '/clients/credits', label: 'Créances', desc: 'Suivi des crédits clients', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-amber-50 text-amber-600' },
    { href: '/stocks', label: 'Stocks', desc: 'Niveaux de stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'bg-teal-50 text-teal-600' },
    { href: '/rapports', label: 'Rapports', desc: 'Analyses et rapports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-indigo-50 text-indigo-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Administration</h1>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card"><p className="stat-label">CA du jour</p><p className="stat-value">{data.todayRevenue.toLocaleString('fr-FR')} FCFA</p></div>
          <div className="stat-card"><p className="stat-label">CA du mois</p><p className="stat-value">{data.monthRevenue.toLocaleString('fr-FR')} FCFA</p></div>
          <div className="stat-card"><p className="stat-label">Alertes stock</p><p className="stat-value text-amber-600">{data.stockAlerts}</p></div>
          <div className="stat-card"><p className="stat-label">Commandes en attente</p><p className="stat-value">{data.pendingOrders}</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(m => (
          <Link key={m.href} href={m.href} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all hover:border-lcg-200 group">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${m.color} flex items-center justify-center shrink-0`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-lcg-600 transition-colors">{m.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-lcg-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
