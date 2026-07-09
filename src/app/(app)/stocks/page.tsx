'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function StocksPage() {
  const { user } = useAuth()
  const [stock, setStock] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stock')
  const [showAdjust, setShowAdjust] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stockRes, movRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/stock/movements?limit=30'),
      ])
      const stockData = await stockRes.json()
      const movData = await movRes.json()
      setStock(stockData.stock || [])
      setMovements(movData.movements || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const lowStock = stock.filter((s: any) => s.quantity <= s.product.minStockLevel)

  const productTypes = [...new Set(stock.map((s: any) => s.product.type))].sort()
  const locations = [...new Set(stock.map((s: any) => s.pointOfSale?.name || s.depot?.name || '—'))].sort()

  const filteredStock = stock.filter((s: any) => {
    if (filterType && s.product.type !== filterType) return false
    if (filterLocation) {
      const loc = s.pointOfSale?.name || s.depot?.name || '—'
      if (loc !== filterLocation) return false
    }
    return true
  })

  const handleAdjust = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    const res = await fetch('/api/stock/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: parseInt(data.productId as string),
        type: data.type,
        quantity: parseInt(data.quantity as string),
        pointOfSaleId: data.pointOfSaleId ? parseInt(data.pointOfSaleId as string) : null,
        reason: data.reason,
      }),
    })

    if (res.ok) {
      toast.success('Mouvement enregistré')
      setShowAdjust(false)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des stocks</h1>
        <div className="flex gap-2">
          {['ADMIN', 'RESPONSABLE_STOCK'].includes(user?.role || '') && (
            <button onClick={() => setShowAdjust(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Mouvement
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

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="font-semibold text-red-800">Alertes de stock bas</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {lowStock.slice(0, 8).map((s: any) => (
              <div key={s.id} className="bg-white p-2 rounded-lg text-sm">
                <p className="font-medium">{s.product.name}</p>
                <p className="text-red-600">Stock: {s.quantity} | Min: {s.product.minStockLevel}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <select
            className="input-field pl-10"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tous les types</option>
            {productTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <select
            className="input-field pl-10"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="">Tous les lieux</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        {(filterType || filterLocation) && (
          <button
            onClick={() => { setFilterType(''); setFilterLocation('') }}
            className="btn-ghost text-sm text-gray-500 hover:text-red-600"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Réinitialiser
          </button>
        )}
      </div>

      <div className="tabs">
        <button onClick={() => setTab('stock')} className={tab === 'stock' ? 'tab-active' : 'tab'}>Stock actuel</button>
        <button onClick={() => setTab('movements')} className={tab === 'movements' ? 'tab-active' : 'tab'}>Mouvements</button>
      </div>

      {loading ? (
        <div className="card">
          <div className="loader">
            <div className="loader-spinner" />
          </div>
        </div>
      ) : tab === 'stock' ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Lieu</th>
                <th className="text-right">Quantité</th>
                <th className="text-right">Stock min</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((s: any) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.product.name}</td>
                  <td className="text-xs">{s.product.type}</td>
                  <td>{s.pointOfSale?.name || s.depot?.name || '—'}</td>
                  <td className="text-right font-bold">{s.quantity}</td>
                  <td className="text-right">{s.product.minStockLevel}</td>
                  <td>
                    <span className={
                      s.quantity <= 0 ? 'badge-danger' :
                      s.quantity <= s.product.minStockLevel ? 'badge-warning' :
                      'badge-success'
                    }>
                      {s.quantity <= 0 ? 'Rupture' : s.quantity <= s.product.minStockLevel ? 'Faible' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Type</th>
                <th className="text-right">Qté</th>
                <th>Motif</th>
                <th>Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m: any) => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>{m.product?.name}</td>
                  <td>
                    <span className={
                      m.type === 'ENTRÉE' ? 'badge-success' :
                      m.type === 'SORTIE' ? 'badge-danger' :
                      'badge-info'
                    }>
                      {m.type}
                    </span>
                  </td>
                  <td className="text-right">{m.quantity}</td>
                  <td className="text-xs">{m.reason || '—'}</td>
                  <td>{m.user?.firstName} {m.user?.lastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdjust && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Mouvement de stock</h2>
              <button type="button" onClick={() => setShowAdjust(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label-field">Produit</label>
                  <select name="productId" className="input-field" required>
                    {stock.map((s: any) => <option key={s.id} value={s.productId}>{s.product.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Type de mouvement</label>
                  <select name="type" className="input-field" required>
                    <option value="ENTRÉE">Entrée en stock</option>
                    <option value="SORTIE">Sortie de stock</option>
                    <option value="PERTE">Perte / Fonte</option>
                    <option value="AJUSTEMENT">Ajustement</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Quantité</label>
                  <input name="quantity" type="number" className="input-field" required min="1" />
                </div>
                <div>
                  <label className="label-field">Motif</label>
                  <input name="reason" className="input-field" placeholder="Raison du mouvement" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAdjust(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
