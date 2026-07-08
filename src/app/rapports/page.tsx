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
    <div className="space-y-6">
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
            <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label-field">Date fin</label>
            <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading} className="btn-primary w-full">
              {loading ? 'Génération...' : 'Générer le rapport'}
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {reportTypes.find(r => r.value === reportType)?.label}
              </h3>
              <div className="flex gap-2">
                <button onClick={exportPDF} className="btn-secondary text-sm">📄 PDF</button>
                <button onClick={exportExcel} className="btn-secondary text-sm">📊 Excel</button>
                <button onClick={exportCSV} className="btn-secondary text-sm">📃 CSV</button>
              </div>
            </div>

            {data.sales && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((s: any) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-mono text-xs">{s.reference}</td>
                        <td className="py-3 px-2">{formatDateTime(s.createdAt)}</td>
                        <td className="py-3 px-2">{s.client?.name || '—'}</td>
                        <td className="py-3 px-2">{s.user?.firstName} {s.user?.lastName}</td>
                        <td className="py-3 px-2">{s.pointOfSale?.name || '—'}</td>
                        <td className="py-3 px-2 text-right font-bold">{formatCurrency(s.total)}</td>
                        <td className="py-3 px-2">
                          <span className="badge bg-green-100 text-green-800">{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2">
                      <td colSpan={5} className="py-3 px-2 text-right">Total:</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(data.total)}</td>
                      <td className="py-3 px-2">{data.count} ventes</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {data.stock && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-3 px-2">Produit</th>
                      <th className="py-3 px-2">Lieu</th>
                      <th className="py-3 px-2 text-right">Stock</th>
                      <th className="py-3 px-2 text-right">Seuil min</th>
                      <th className="py-3 px-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stock.map((s: any) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">{s.product?.name}</td>
                        <td className="py-3 px-2">{s.pointOfSale?.name || s.depot?.name || '—'}</td>
                        <td className="py-3 px-2 text-right">{s.quantity}</td>
                        <td className="py-3 px-2 text-right">{s.product?.minStockLevel}</td>
                        <td className="py-3 px-2">
                          <span className={`badge ${s.quantity <= s.product?.minStockLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-3 px-2">Lot</th>
                      <th className="py-3 px-2">Produit</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2 text-right">Produit</th>
                      <th className="py-3 px-2 text-right">Perte</th>
                      <th className="py-3 px-2">Destination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batches.map((b: any) => (
                      <tr key={b.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-mono text-xs">{b.batchNumber}</td>
                        <td className="py-3 px-2">{b.product?.name}</td>
                        <td className="py-3 px-2">{new Date(b.productionDate).toLocaleDateString('fr-FR')}</td>
                        <td className="py-3 px-2 text-right">{b.quantityProduced}</td>
                        <td className="py-3 px-2 text-right text-red-600">{b.quantityLost || '—'}</td>
                        <td className="py-3 px-2">{b.destinationDepot?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2">
                      <td colSpan={3} className="py-3 px-2 text-right">Total:</td>
                      <td className="py-3 px-2 text-right">{data.totalProduced}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {data.clients && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-3 px-2">Nom</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Téléphone</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2 text-right">Ventes</th>
                      <th className="py-3 px-2 text-right">Commandes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{c.name}</td>
                        <td className="py-3 px-2">{c.type}</td>
                        <td className="py-3 px-2">{c.phone || '—'}</td>
                        <td className="py-3 px-2">{c.email || '—'}</td>
                        <td className="py-3 px-2 text-right">{c._count?.sales || 0}</td>
                        <td className="py-3 px-2 text-right">{c._count?.orders || 0}</td>
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
