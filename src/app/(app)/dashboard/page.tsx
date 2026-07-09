'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

interface DashboardData {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  todaySales: number
  todayCash: number
  stockAlerts: number
  pendingOrders: number
  todayProduction: number
  salesByProduct: { name: string; total: number }[]
  salesByHour: { hour: string; total: number }[]
  topProducts: { name: string; total: number }[]
  lowStockProducts: { name: string; quantity: number; minLevel: number }[]
}

const statCards = [
  { key: 'todayRevenue', label: 'CA du jour', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
  { key: 'weekRevenue', label: 'CA de la semaine', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
  { key: 'monthRevenue', label: 'CA du mois', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
  { key: 'todaySales', label: 'Ventes du jour', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
]

const secondaryStatCards = [
  { key: 'todayCash', label: 'Encaissements', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50' },
  { key: 'stockAlerts', label: 'Alertes stock', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', color: 'from-red-500 to-red-600', bg: 'bg-red-50' },
  { key: 'pendingOrders', label: 'Commandes en attente', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50' },
  { key: 'todayProduction', label: 'Production du jour', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-spinner" />
      </div>
    )
  }

  const getStatValue = (key: string) => {
    if (!data) return 0
    switch (key) {
      case 'todayRevenue': return data.todayRevenue
      case 'weekRevenue': return data.weekRevenue
      case 'monthRevenue': return data.monthRevenue
      case 'todaySales': return data.todaySales
      case 'todayCash': return data.todayCash
      case 'stockAlerts': return data.stockAlerts
      case 'pendingOrders': return data.pendingOrders
      case 'todayProduction': return `${data.todayProduction} sacs`
      default: return 0
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="text-gray-400 text-sm mt-1">Bienvenue, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex gap-2">
          <span className="badge-info">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.key} className="card-hover">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <svg className={`w-6 h-6 ${card.color.replace('from-', 'text-').split(' ')[0].replace('from-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{typeof getStatValue(card.key) === 'number' ? formatCurrency(getStatValue(card.key) as number) : getStatValue(card.key)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStatCards.map(card => (
          <div key={card.key} className="card-hover">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <svg className={`w-6 h-6 ${card.color.replace('from-', 'text-').split(' ')[0].replace('from-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{getStatValue(card.key)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Ventes du jour par heure</h3>
          {data?.salesByHour && data.salesByHour.length > 0 ? (
            <Line
              data={{
                labels: data.salesByHour.map(s => s.hour),
                datasets: [{
                  label: 'Ventes',
                  data: data.salesByHour.map(s => s.total),
                  borderColor: '#1e40af',
                  backgroundColor: 'rgba(30, 64, 175, 0.1)',
                  fill: true,
                  tension: 0.3,
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }}
            />
          ) : (
            <div className="empty-state py-12">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-text">Aucune vente aujourd'hui</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Top produits vendus</h3>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <Bar
              data={{
                labels: data.topProducts.slice(0, 5).map(p => p.name),
                datasets: [{
                  label: 'Quantité',
                  data: data.topProducts.slice(0, 5).map(p => p.total),
                  backgroundColor: '#1e40af',
                  borderRadius: 4,
                }],
              }}
              options={{
                responsive: true,
                indexAxis: 'y' as const,
                plugins: { legend: { display: false } },
                scales: { y: { grid: { display: false } }, x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } } },
              }}
            />
          ) : (
            <div className="empty-state py-12">
              <div className="empty-state-icon">📦</div>
              <p className="empty-state-text">Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Répartition des ventes par produit</h3>
          {data?.salesByProduct && data.salesByProduct.length > 0 ? (
            <div className="flex justify-center">
              <div className="w-72">
                <Doughnut
                  data={{
                    labels: data.salesByProduct.map(p => p.name),
                    datasets: [{
                      data: data.salesByProduct.map(p => p.total),
                      backgroundColor: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
                      borderWidth: 2,
                      borderColor: '#fff',
                    }],
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' } } } }}
                />
              </div>
            </div>
          ) : (
            <div className="empty-state py-12">
              <div className="empty-state-icon">📈</div>
              <p className="empty-state-text">Aucune donnée</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Produits en alerte de stock</h3>
          {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Stock: {p.quantity} · Min: {p.minLevel}</p>
                    </div>
                  </div>
                  <span className="badge-danger">Rupture imminente</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-12">
              <div className="empty-state-icon">✅</div>
              <p className="empty-state-text">Aucune alerte stock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
