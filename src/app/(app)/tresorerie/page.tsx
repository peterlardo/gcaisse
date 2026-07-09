'use client'

import { useState, useEffect } from 'react'

export default function TresoreriePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/tresorerie?period=${period}`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const format = (n: number) => n.toLocaleString('fr-FR') + ' FCFA'

  if (loading) return <div className="flex items-center justify-center py-20"><div className="loader-spinner" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Trésorerie</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="input-field max-w-[150px]">
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total encaissements</p>
          <p className="text-3xl font-bold text-emerald-600">{format(data?.totalSales || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{data?.salesCount || 0} vente(s)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total dépenses</p>
          <p className="text-3xl font-bold text-red-600">{format(data?.totalExpenses || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{data?.expenseCount || 0} dépense(s)</p>
        </div>
        <div className={`bg-white rounded-xl shadow-sm border p-6 ${(data?.balance || 0) >= 0 ? 'border-lcg-200 bg-lcg-50/30' : 'border-red-200 bg-red-50/30'}`}>
          <p className="text-sm text-gray-500 mb-1">Solde net</p>
          <p className={`text-3xl font-bold ${(data?.balance || 0) >= 0 ? 'text-lcg-600' : 'text-red-600'}`}>{format(data?.balance || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{period === 'today' ? "Aujourd'hui" : period === 'week' ? 'Cette semaine' : period === 'month' ? 'Ce mois' : "Cette année"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Méthodes de paiement</h2>
        </div>
        <div className="p-6">
          {data?.paymentMethods && data.paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {data.paymentMethods.map((pm: any) => {
                const total = data.paymentMethods.reduce((s: number, p: any) => s + p.total, 0)
                const pct = total > 0 ? ((pm.total / total) * 100).toFixed(1) : 0
                return (
                  <div key={pm.method}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{pm.method === 'ESPECES' ? 'Espèces' : pm.method === 'MOBILE_MONEY' ? 'Mobile Money' : pm.method === 'CARTE' ? 'Carte' : pm.method}</span>
                      <span className="text-gray-500">{pm.total.toLocaleString('fr-FR')} FCFA ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lcg-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune donnée</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold">Dernières ventes</h2></div>
          <div className="divide-y divide-gray-50">
            {data?.recentSales?.slice(0, 5).map((s: any) => (
              <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium">{s.reference}</p><p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</p></div>
                <p className="text-sm font-semibold text-emerald-600">{s.total.toLocaleString('fr-FR')}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold">Dernières dépenses</h2></div>
          <div className="divide-y divide-gray-50">
            {data?.recentExpenses?.slice(0, 5).map((e: any) => (
              <div key={e.id} className="px-6 py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium">{e.description}</p><p className="text-xs text-gray-400">{e.category?.name}</p></div>
                <p className="text-sm font-semibold text-red-600">{e.amount.toLocaleString('fr-FR')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
