'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/invoice'
import toast from 'react-hot-toast'
import { downloadExcel } from '@/lib/export'

export default function HistoriqueVentesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' })
  const [selectedSale, setSelectedSale] = useState<any>(null)

  useEffect(() => { fetchSales() }, [])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      const res = await fetch(`/api/sales?${params}`)
      const data = await res.json()
      setSales(data.sales || [])
    } catch {} finally { setLoading(false) }
  }

  const openDetail = async (id: number) => {
    const res = await fetch(`/api/sales/${id}`)
    if (res.ok) setSelectedSale((await res.json()).sale || (await res.json()))
  }

  const printInvoice = (sale: any) => {
    try {
      generateInvoicePDF({
        reference: sale.reference,
        date: new Date(sale.createdAt),
        clientName: sale.client?.name,
        clientPhone: sale.client?.phone,
        clientAddress: sale.client?.address,
        pointOfSale: sale.pointOfSale?.name || 'N/A',
        items: (sale.items || []).map((i: any) => ({
          name: i.product?.name || 'Produit',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
        subtotal: sale.subtotal || sale.total,
        discount: sale.discount || 0,
        discountLabel: sale.discountLabel,
        total: sale.total,
        paidAmount: sale.paidAmount || sale.total,
        status: sale.status,
        cashier: sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'N/A',
      })
    } catch (e) {
      toast.error('Erreur de génération PDF')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Historique des ventes</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExcel('ventes')} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
          <button onClick={fetchSales} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Actualiser
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="date" className="input-field w-auto" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
          <input type="date" className="input-field w-auto" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          <button onClick={fetchSales} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filtrer
          </button>
        </div>

        {loading ? <div className="loader"><div className="loader-spinner" /></div>
        : sales.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
          <p className="empty-state-title">Aucune vente</p><p className="empty-state-text">Aucune vente trouvée pour la période sélectionnée.</p></div>
        ) : (
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="table">
              <thead><tr><th>Réf</th><th>Date</th><th>Client</th><th>Vendeur</th><th>Point de vente</th><th className="text-right">Total</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td className="font-medium">{sale.reference}</td>
                    <td>{formatDateTime(sale.createdAt)}</td>
                    <td>{sale.client?.name || '—'}</td>
                    <td>{sale.user?.firstName} {sale.user?.lastName}</td>
                    <td>{sale.pointOfSale?.name}</td>
                    <td className="text-right font-bold">{formatCurrency(sale.total)}</td>
                    <td><span className={`badge ${getStatusColor(sale.status)}`}>{sale.status}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openDetail(sale.id)} className="btn-ghost btn-sm" title="Détails">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => printInvoice(sale)} className="btn-ghost btn-sm" title="Facture PDF">
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedSale(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedSale.reference}</h2>
                <p className="text-sm text-gray-400">{formatDateTime(selectedSale.createdAt)}</p>
              </div>
              <span className={`badge ${getStatusColor(selectedSale.status)}`}>{selectedSale.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-400">Client:</span> <span className="font-medium">{selectedSale.client?.name || 'Particulier'}</span></div>
              <div><span className="text-gray-400">Point de vente:</span> <span className="font-medium">{selectedSale.pointOfSale?.name}</span></div>
              <div><span className="text-gray-400">Vendeur:</span> <span className="font-medium">{selectedSale.user?.firstName} {selectedSale.user?.lastName}</span></div>
              <div><span className="text-gray-400">Payé:</span> <span className="font-medium">{(selectedSale.paidAmount || selectedSale.total).toLocaleString('fr-FR')} FCFA</span></div>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-2">Articles</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400 border-b"><th className="text-left pb-1">Produit</th><th className="text-center pb-1">Qté</th><th className="text-right pb-1">P.U.</th><th className="text-right pb-1">Total</th></tr></thead>
                <tbody>
                  {(selectedSale.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5">{item.product?.name || 'Produit'}</td>
                      <td className="text-center py-1.5">{item.quantity}</td>
                      <td className="text-right py-1.5">{item.unitPrice.toLocaleString('fr-FR')}</td>
                      <td className="text-right py-1.5 font-medium">{item.total.toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="text-right pt-2 font-semibold">Total:</td><td className="text-right pt-2 font-bold text-lcg-600">{selectedSale.total.toLocaleString('fr-FR')} FCFA</td></tr>
                </tfoot>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setSelectedSale(null)} className="btn-secondary">Fermer</button>
              <button onClick={() => printInvoice(selectedSale)} className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Facture PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
