'use client'

import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'

export default function RapportsPage() {
  const [reportType, setReportType] = useState('sales')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const reportTypes = [
    { value: 'sales', label: 'Rapport des ventes' },
    { value: 'cash', label: 'Rapport de caisse' },
    { value: 'stock', label: 'Rapport de stock' },
    { value: 'production', label: 'Rapport de production' },
    { value: 'distribution', label: 'Rapport de distribution' },
    { value: 'clients', label: 'Rapport clients' },
    { value: 'performance', label: 'Performance commerciale' },
  ]

  const generateReport = async () => {
    if (!dateFrom || !dateTo) { toast.error('Sélectionnez une période'); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: reportType, dateFrom, dateTo })
      const res = await fetch(`/api/reports?${params}`)
      const result = await res.json()
      setData(result.report)
      toast.success('Rapport généré')
    } catch (err) {
      toast.error('Erreur de génération')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    const title = reportTypes.find(r => r.value === reportType)?.label || 'Rapport'
    doc.setFontSize(16)
    doc.text(`LCG - ${title}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Période: ${dateFrom} au ${dateTo}`, 14, 30)
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 36)

    let y = 44
    if (data?.sales) {
      const tableData = data.sales.map((s: any) => [
        s.reference, new Date(s.createdAt).toLocaleDateString('fr-FR'),
        `${s.user?.firstName} ${s.user?.lastName}`,
        `${s.total} FCFA`,
      ])
      ;(doc as any).autoTable({
        startY: y,
        head: [['Réf', 'Date', 'Vendeur', 'Total']],
        body: tableData,
      })
    } else if (data?.stock) {
      const tableData = data.stock.map((s: any) => [
        s.product?.name, s.pointOfSale?.name || s.depot?.name || '',
        `${s.quantity}`, s.product?.minStockLevel,
      ])
      ;(doc as any).autoTable({
        startY: y,
        head: [['Produit', 'Lieu', 'Qté', 'Seuil min']],
        body: tableData,
      })
    } else if (data?.batches) {
      const tableData = data.batches.map((b: any) => [
        b.batchNumber, b.product?.name, `${b.quantityProduced}`,
        new Date(b.productionDate).toLocaleDateString('fr-FR'),
      ])
      ;(doc as any).autoTable({
        startY: y,
        head: [['Lot', 'Produit', 'Qté', 'Date']],
        body: tableData,
      })
    }

    doc.save(`LCG_${reportType}_${dateFrom}_${dateTo}.pdf`)
    toast.success('PDF exporté')
  }

  const exportExcel = () => {
    let wsData: any[] = []

    if (data?.sales) {
      wsData = data.sales.map((s: any) => ({
        Référence: s.reference, Date: new Date(s.createdAt).toLocaleDateString('fr-FR'),
        Client: s.client?.name || '', Vendeur: `${s.user?.firstName} ${s.user?.lastName}`,
        Total: s.total, Statut: s.status,
      }))
    } else if (data?.stock) {
      wsData = data.stock.map((s: any) => ({
        Produit: s.product?.name, Lieu: s.pointOfSale?.name || s.depot?.name || '',
        Quantité: s.quantity, 'Seuil minimum': s.product?.minStockLevel,
      }))
    } else if (data?.batches) {
      wsData = data.batches.map((b: any) => ({
        Lot: b.batchNumber, Produit: b.product?.name,
        Quantité: b.quantityProduced, Date: new Date(b.productionDate).toLocaleDateString('fr-FR'),
      }))
    } else if (data?.clients) {
      wsData = data.clients.map((c: any) => ({
        Nom: c.name, Type: c.type, Téléphone: c.phone || '',
        Email: c.email || '', Ville: c.city, Ventes: c._count?.sales || 0,
      }))
    }

    if (wsData.length === 0) { toast.error('Aucune donnée à exporter'); return }

    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport')
    XLSX.writeFile(wb, `LCG_${reportType}_${dateFrom}_${dateTo}.xlsx`)
    toast.success('Excel exporté')
  }

  const exportCSV = () => {
    let wsData: any[] = []
    if (data?.sales) {
      wsData = data.sales.map((s: any) => ({
        Référence: s.reference, Date: new Date(s.createdAt).toLocaleDateString('fr-FR'),
        Client: s.client?.name || '', Vendeur: `${s.user?.firstName} ${s.user?.lastName}`,
        Total: s.total, Statut: s.status,
      }))
    }
    if (wsData.length === 0) { toast.error('Aucune donnée'); return }

    const ws = XLSX.utils.json_to_sheet(wsData)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `LCG_${reportType}_${dateFrom}_${dateTo}.csv`
    link.click()
    toast.success('CSV exporté')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Rapports de gestion</h1>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="label-field">Type de rapport</label>
            <select className="input-field" value={reportType} onChange={e => setReportType(e.target.value)}>
              {reportTypes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Date début</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input type="date" className="input-field pl-10" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label-field">Date fin</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input type="date" className="input-field pl-10" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Génération...
                </span>
              ) : 'Générer le rapport'}
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {reportTypes.find(r => r.value === reportType)?.label}
              </h3>
              <div className="flex gap-2">
                <button onClick={exportPDF} className="btn-secondary btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>
                <button onClick={exportExcel} className="btn-secondary btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
                <button onClick={exportCSV} className="btn-secondary btn-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
              </div>
            </div>

            {data.sales && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((s: any) => (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.reference}</td>
                        <td>{formatDateTime(s.createdAt)}</td>
                        <td>{s.client?.name || '—'}</td>
                        <td>{s.user?.firstName} {s.user?.lastName}</td>
                        <td>{s.pointOfSale?.name || '—'}</td>
                        <td className="text-right font-bold">{formatCurrency(s.total)}</td>
                        <td>
                          <span className="badge-success">{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2">
                      <td colSpan={5} className="text-right px-4 py-3">Total:</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(data.total)}</td>
                      <td className="px-4 py-3">{data.count} ventes</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {data.stock && (
              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Lieu</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Seuil min</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stock.map((s: any) => (
                      <tr key={s.id}>
                        <td>{s.product?.name}</td>
                        <td>{s.pointOfSale?.name || s.depot?.name || '—'}</td>
                        <td className="text-right">{s.quantity}</td>
                        <td className="text-right">{s.product?.minStockLevel}</td>
                        <td>
                          <span className={s.quantity <= s.product?.minStockLevel ? 'badge-danger' : 'badge-success'}>
                            {s.quantity <= s.product?.minStockLevel ? 'Alerte' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.batches && (
              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lot</th>
                      <th>Produit</th>
                      <th>Date</th>
                      <th className="text-right">Produit</th>
                      <th className="text-right">Perte</th>
                      <th>Destination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batches.map((b: any) => (
                      <tr key={b.id}>
                        <td className="font-mono text-xs">{b.batchNumber}</td>
                        <td>{b.product?.name}</td>
                        <td>{new Date(b.productionDate).toLocaleDateString('fr-FR')}</td>
                        <td className="text-right">{b.quantityProduced}</td>
                        <td className="text-right text-red-600">{b.quantityLost || '—'}</td>
                        <td>{b.destinationDepot?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2">
                      <td colSpan={3} className="text-right px-4 py-3">Total:</td>
                      <td className="px-4 py-3 text-right">{data.totalProduced}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {data.clients && (
              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Type</th>
                      <th>Téléphone</th>
                      <th>Email</th>
                      <th className="text-right">Ventes</th>
                      <th className="text-right">Commandes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients.map((c: any) => (
                      <tr key={c.id}>
                        <td className="font-medium">{c.name}</td>
                        <td>{c.type}</td>
                        <td>{c.phone || '—'}</td>
                        <td>{c.email || '—'}</td>
                        <td className="text-right">{c._count?.sales || 0}</td>
                        <td className="text-right">{c._count?.orders || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
