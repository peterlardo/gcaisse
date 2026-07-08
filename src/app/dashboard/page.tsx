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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lcg-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="text-gray-500 text-sm">Bienvenue, {user?.firstName} {user?.lastName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="CA du jour" value={formatCurrency(data?.todayRevenue || 0)} color="blue" />
        <StatCard title="CA de la semaine" value={formatCurrency(data?.weekRevenue || 0)} color="green" />
        <StatCard title="CA du mois" value={formatCurrency(data?.monthRevenue || 0)} color="purple" />
        <StatCard title="Ventes journalières" value={String(data?.todaySales || 0)} color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Encaissements du jour" value={formatCurrency(data?.todayCash || 0)} color="teal" />
        <StatCard title="Alertes stock" value={String(data?.stockAlerts || 0)} color="red" />
        <StatCard title="Commandes en attente" value={String(data?.pendingOrders || 0)} color="yellow" />
        <StatCard title="Production du jour" value={String(data?.todayProduction || 0) + ' sacs'} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Ventes du jour par heure</h3>
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
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">Aucune vente aujourd'hui</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top produits vendus</h3>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <Bar
              data={{
                labels: data.topProducts.slice(0, 5).map(p => p.name),
                datasets: [{
                  label: 'Quantité',
                  data: data.topProducts.slice(0, 5).map(p => p.total),
                  backgroundColor: '#1e40af',
                }],
              }}
              options={{
                responsive: true,
                indexAxis: 'y' as const,
                plugins: { legend: { display: false } },
              }}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">Aucune donnée</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Répartition des ventes par produit</h3>
          {data?.salesByProduct && data.salesByProduct.length > 0 ? (
            <Doughnut
              data={{
                labels: data.salesByProduct.map(p => p.name),
                datasets: [{
                  data: data.salesByProduct.map(p => p.total),
                  backgroundColor: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
                }],
              }}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">Aucune donnée</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Produits en alerte de stock</h3>
          {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">Stock: {p.quantity} | Min: {p.minLevel}</p>
                  </div>
                  <span className="badge bg-red-100 text-red-800">Rupture imminente</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Aucune alerte stock</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    teal: 'bg-teal-50 border-teal-200 text-teal-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  }
  return (
    <div className={`card-stat border ${colors[color] || colors.blue}`}>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    </div>
  )
}
