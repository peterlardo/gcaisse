'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

export default function StatistiquesPage() {
  const [stats, setStats] = useState<any>(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [period])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?period=${period}`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Statistiques</h1>
        <div className="flex gap-2">
          {['today', 'week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                period === p ? 'bg-lcg-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'today' ? 'Aujourd\'hui' : p === 'week' ? '7 jours' : p === 'month' ? 'Ce mois' : 'Cette année'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lcg-500 mx-auto"></div></div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-stat bg-blue-50 border-blue-200">
              <div><p className="text-xs text-gray-500">Revenu total</p><p className="text-xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p></div>
            </div>
            <div className="card-stat bg-green-50 border-green-200">
              <div><p className="text-xs text-gray-500">Nombre de ventes</p><p className="text-xl font-bold mt-1">{stats.totalSales}</p></div>
            </div>
            <div className="card-stat bg-purple-50 border-purple-200">
              <div><p className="text-xs text-gray-500">Produits vendus</p><p className="text-xl font-bold mt-1">{stats.productStats?.reduce((s: number, p: any) => s + p.quantity, 0) || 0}</p></div>
            </div>
            <div className="card-stat bg-indigo-50 border-indigo-200">
              <div><p className="text-xs text-gray-500">Meilleur vendeur</p><p className="text-xl font-bold mt-1 text-sm">{stats.userStats?.[0]?.name || '—'}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Ventes par produit</h3>
              {stats.productStats?.length > 0 ? (
                <Bar
                  data={{
                    labels: stats.productStats.slice(0, 8).map((p: any) => p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name),
                    datasets: [{ label: 'Quantité', data: stats.productStats.slice(0, 8).map((p: any) => p.quantity), backgroundColor: '#1e40af' }],
                  }}
                  options={{ responsive: true, indexAxis: 'y' as const, plugins: { legend: { display: false } } }}
                />
              ) : <p className="text-gray-400 text-center py-8">Aucune donnée</p>}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Ventes par point de vente</h3>
              {stats.pvStats?.length > 0 ? (
                <Doughnut
                  data={{
                    labels: stats.pvStats.map((p: any) => p.name),
                    datasets: [{ data: stats.pvStats.map((p: any) => p.total), backgroundColor: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'] }],
                  }}
                />
              ) : <p className="text-gray-400 text-center py-8">Aucune donnée</p>}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Top 10 produits</h3>
              {stats.topProducts?.length > 0 ? (
                <div className="space-y-2">
                  {stats.topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm">{i + 1}. {p.name.length > 25 ? p.name.substring(0, 25) + '…' : p.name}</span>
                      <span className="text-sm font-bold">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-center py-8">Aucune donnée</p>}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Saisonnalité des ventes</h3>
              {stats.seasonality?.length > 0 ? (
                <Line
                  data={{
                    labels: stats.seasonality.map((s: any) => s.month),
                    datasets: [{ label: 'Ventes', data: stats.seasonality.map((s: any) => s.total), borderColor: '#1e40af', backgroundColor: 'rgba(30, 64, 175, 0.1)', fill: true }],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              ) : <p className="text-gray-400 text-center py-8">Aucune donnée</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Classement des vendeurs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Vendeur</th>
                    <th className="py-3 px-2 text-right">Ventes</th>
                    <th className="py-3 px-2 text-right">CA</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.userStats?.map((u: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">{i + 1}</td>
                      <td className="py-3 px-2 font-medium">{u.name}</td>
                      <td className="py-3 px-2 text-right">{u.count}</td>
                      <td className="py-3 px-2 text-right font-bold">{formatCurrency(u.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 py-12">Aucune donnée statistique disponible</p>
      )}
    </div>
  )
}
