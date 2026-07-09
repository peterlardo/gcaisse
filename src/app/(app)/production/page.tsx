'use client'

import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function ProductionPage() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [depots, setDepots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [batchRes, prodRes, depRes] = await Promise.all([
        fetch('/api/production'),
        fetch('/api/products?active=true'),
        fetch('/api/depots'),
      ])
      setBatches((await batchRes.json()).batches || [])
      setProducts((await prodRes.json()).products || [])
      setDepots((await depRes.json()).depots || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    const res = await fetch('/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('Production enregistrée')
      setShowModal(false)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const totalProduced = batches.reduce((s, b) => s + b.quantityProduced, 0)
  const totalLost = batches.reduce((s, b) => s + b.quantityLost, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Production</h1>
        <div className="flex gap-2">
          {['ADMIN', 'RESPONSABLE_PRODUCTION'].includes(user?.role || '') && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau lot
            </button>
          )}
          <button onClick={fetchData} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total produit</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{totalProduced} sacs</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Lots enregistrés</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{batches.length}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Pertes totales</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{totalLost} sacs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Lots de production</h3>
        {loading ? (
          <div className="card">
            <div className="loader">
              <div className="loader-spinner" />
            </div>
          </div>
        ) : batches.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <p className="empty-state-title">Aucun lot</p>
              <p className="empty-state-text">Enregistrez un premier lot de production.</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Produit</th>
                  <th>Date</th>
                  <th className="text-right">Produit</th>
                  <th className="text-right">Perte</th>
                  <th>Destination</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b: any) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs">{b.batchNumber}</td>
                    <td>{b.product?.name}</td>
                    <td>{formatDateTime(b.productionDate)}</td>
                    <td className="text-right font-bold">{b.quantityProduced}</td>
                    <td className="text-right text-red-600">{b.quantityLost > 0 ? b.quantityLost : '—'}</td>
                    <td>{b.destinationDepot?.name || '—'}</td>
                    <td>{b.user?.firstName} {b.user?.lastName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Nouveau lot de production</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label-field">Produit</label>
                  <select name="productId" className="input-field" required>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Quantité produite</label>
                  <input name="quantityProduced" type="number" className="input-field" required min="1" />
                </div>
                <div>
                  <label className="label-field">Pertes éventuelles</label>
                  <input name="quantityLost" type="number" className="input-field" defaultValue="0" min="0" />
                </div>
                <div>
                  <label className="label-field">Destination (dépôt)</label>
                  <select name="destinationDepotId" className="input-field">
                    <option value="">Sélectionner</option>
                    {depots.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Notes</label>
                  <textarea name="notes" className="input-field" rows={2}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
