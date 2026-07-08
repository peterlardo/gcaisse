'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'

export default function HistoriqueVentesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' })

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      const res = await fetch(`/api/sales?${params}`)
      const data = await res.json()
      setSales(data.sales || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Historique des ventes</h1>
        <button onClick={fetchSales} className="btn-secondary">Actualiser</button>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <input type="date" className="input-field w-auto" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
          <input type="date" className="input-field w-auto" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          <button onClick={fetchSales} className="btn-primary">Filtrer</button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Réf</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Client</th>
                  <th className="py-3 px-2">Vendeur</th>
                  <th className="py-3 px-2">Point de vente</th>
                  <th className="py-3 px-2 text-right">Total</th>
                  <th className="py-3 px-2">Statut</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{sale.reference}</td>
                    <td className="py-3 px-2">{formatDateTime(sale.createdAt)}</td>
                    <td className="py-3 px-2">{sale.client?.name || '—'}</td>
                    <td className="py-3 px-2">{sale.user?.firstName} {sale.user?.lastName}</td>
                    <td className="py-3 px-2">{sale.pointOfSale?.name}</td>
                    <td className="py-3 px-2 text-right font-bold">{formatCurrency(sale.total)}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${getStatusColor(sale.status)}`}>{sale.status}</span>
                    </td>
                    <td className="py-3 px-2">
                      <button className="text-lcg-500 text-xs">Détails</button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucune vente trouvée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
