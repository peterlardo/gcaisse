'use client'

import { useState, useEffect } from 'react'
import { formatDateTime, getDistributionStatusLabel, getStatusColor } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function DistributionPage() {
  const { user } = useAuth()
  const [distributions, setDistributions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [depots, setDepots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [distRes, prodRes, depRes] = await Promise.all([
        fetch('/api/distribution'),
        fetch('/api/products?active=true'),
        fetch('/api/depots'),
      ])
      setDistributions((await distRes.json()).distributions || [])
      setProducts((await prodRes.json()).products || [])
      setDepots((await depRes.json()).depots || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const productIds = form.getAll('productId[]')
    const quantities = form.getAll('quantity[]')

    const items = productIds.map((pid, i) => ({
      productId: parseInt(pid as string),
      quantity: parseInt(quantities[i] as string),
    }))

    const res = await fetch('/api/distribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDepotId: parseInt(form.get('sourceDepotId') as string),
        notes: form.get('notes') as string,
        items,
      }),
    })

    if (res.ok) {
      toast.success('Distribution créée')
      setShowModal(false)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const handleValidate = async (id: number) => {
    const res = await fetch(`/api/distribution/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'VALIDATE', destDepotId: 1 }),
    })
    if (res.ok) {
      toast.success('Distribution validée')
      fetchData()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Distribution</h1>
        {['ADMIN', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_STOCK'].includes(user?.role || '') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle distribution
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1 2 1 2-1 2 1 2-1 2 1zM6 14h.01M8 10h.01M17 13l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total distributions</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{distributions.length}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">En préparation</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{distributions.filter(d => d.status === 'EN_PRÉPARATION').length}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Livrées</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{distributions.filter(d => d.status === 'LIVRÉ').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Distributions</h3>
        {loading ? (
          <div className="card">
            <div className="loader">
              <div className="loader-spinner" />
            </div>
          </div>
        ) : distributions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1 2 1 2-1 2 1 2-1 2 1zM6 14h.01M8 10h.01M17 13l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>
              <p className="empty-state-title">Aucune distribution</p>
              <p className="empty-state-text">Créez une nouvelle distribution pour commencer.</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Réf</th>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Produits</th>
                  <th>Statut</th>
                  <th>Responsable</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((d: any) => (
                  <tr key={d.id}>
                    <td className="font-mono text-xs">{d.reference}</td>
                    <td>{formatDateTime(d.createdAt)}</td>
                    <td>{d.sourceDepot?.name}</td>
                    <td>
                      {d.items?.map((i: any) => `${i.product?.name} (x${i.quantitySent})`).join(', ')}
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(d.status)}`}>{getDistributionStatusLabel(d.status)}</span>
                    </td>
                    <td>{d.user?.firstName} {d.user?.lastName}</td>
                    <td>
                      {d.status === 'EN_PRÉPARATION' && (
                        <button onClick={() => handleValidate(d.id)} className="btn-success btn-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Valider
                        </button>
                      )}
                    </td>
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
              <h2 className="text-lg font-bold">Nouvelle distribution</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label-field">Dépôt source</label>
                  <select name="sourceDepotId" className="input-field" required>
                    {depots.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Notes</label>
                  <textarea name="notes" className="input-field" rows={2}></textarea>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Produits à distribuer</h4>
                  {products.map((p: any, idx: number) => (
                    <div key={p.id} className="flex items-center gap-2 mb-2">
                      <input type="hidden" name="productId[]" value={p.id} />
                      <span className="flex-1 text-sm">{p.name}</span>
                      <input name="quantity[]" type="number" className="input-field w-20" placeholder="Qté" min="0" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
