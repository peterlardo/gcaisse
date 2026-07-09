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
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Historique des ventes</h1>
        <button onClick={fetchSales} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input type="date" className="input-field pl-10 w-auto" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
          </div>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input type="date" className="input-field pl-10 w-auto" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          </div>
          <button onClick={fetchSales} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtrer
          </button>
        </div>

        {loading ? (
          <div className="loader">
            <div className="loader-spinner" />
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="empty-state-title">Aucune vente</p>
            <p className="empty-state-text">Aucune vente trouvée pour la période sélectionnée.</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Réf</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Vendeur</th>
                  <th>Point de vente</th>
                  <th className="text-right">Total</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td className="font-medium">{sale.reference}</td>
                    <td>{formatDateTime(sale.createdAt)}</td>
                    <td>{sale.client?.name || '—'}</td>
                    <td>{sale.user?.firstName} {sale.user?.lastName}</td>
                    <td>{sale.pointOfSale?.name}</td>
                    <td className="text-right font-bold">{formatCurrency(sale.total)}</td>
                    <td>
                      <span className={`badge ${getStatusColor(sale.status)}`}>{sale.status}</span>
                    </td>
                    <td>
                      <button className="btn-ghost btn-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
