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
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Statistiques</h1>
        <div className="tabs">
          {(['today', 'week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={period === p ? 'tab-active' : 'tab'}
            >
              {p === 'today' ? 'Aujourd\'hui' : p === 'week' ? '7 jours' : p === 'month' ? 'Ce mois' : 'Cette année'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loader py-16">
          <div className="loader-spinner h-12 w-12" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-hover">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Revenu total</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="card-hover">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Nombre de ventes</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.totalSales}</p>
                </div>
              </div>
            </div>
            <div className="card-hover">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Produits vendus</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.productStats?.reduce((s: number, p: any) => s + p.quantity, 0) || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-hover">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Meilleur vendeur</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5 text-sm">{stats.userStats?.[0]?.name || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Ventes par produit</h3>
              {stats.productStats?.length > 0 ? (
                <Bar
                  data={{
                    labels: stats.productStats.slice(0, 8).map((p: any) => p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name),
                    datasets: [{ label: 'Quantité', data: stats.productStats.slice(0, 8).map((p: any) => p.quantity), backgroundColor: '#1e40af' }],
                  }}
                  options={{ responsive: true, indexAxis: 'y' as const, plugins: { legend: { display: false } } }}
                />
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="empty-state-text">Aucune donnée</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Ventes par point de vente</h3>
              {stats.pvStats?.length > 0 ? (
                <div className="flex justify-center">
                  <div className="w-72">
                    <Doughnut
                      data={{
                        labels: stats.pvStats.map((p: any) => p.name),
                        datasets: [{ data: stats.pvStats.map((p: any) => p.total), backgroundColor: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'] }],
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="empty-state-text">Aucune donnée</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Top 10 produits</h3>
              {stats.topProducts?.length > 0 ? (
                <div className="space-y-2">
                  {stats.topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm">{i + 1}. {p.name.length > 25 ? p.name.substring(0, 25) + '…' : p.name}</span>
                      <span className="text-sm font-bold">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="empty-state-text">Aucune donnée</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Saisonnalité des ventes</h3>
              {stats.seasonality?.length > 0 ? (
                <Line
                  data={{
                    labels: stats.seasonality.map((s: any) => s.month),
                    datasets: [{ label: 'Ventes', data: stats.seasonality.map((s: any) => s.total), borderColor: '#1e40af', backgroundColor: 'rgba(30, 64, 175, 0.1)', fill: true }],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="empty-state-text">Aucune donnée</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Classement des vendeurs</h3>
            {stats.userStats?.length > 0 ? (
              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vendeur</th>
                      <th className="text-right">Ventes</th>
                      <th className="text-right">CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.userStats?.map((u: any, i: number) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="font-medium">{u.name}</td>
                        <td className="text-right">{u.count}</td>
                        <td className="text-right font-bold">{formatCurrency(u.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state py-12">
                <div className="empty-state-icon">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="empty-state-text">Aucune donnée</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="empty-state-text">Aucune donnée statistique disponible</p>
          </div>
        </div>
      )}
    </div>
  )
}
