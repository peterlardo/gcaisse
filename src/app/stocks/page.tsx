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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Gestion des stocks</h1>
        <div className="flex gap-2">
          {['ADMIN', 'RESPONSABLE_STOCK'].includes(user?.role || '') && (
            <button onClick={() => setShowAdjust(true)} className="btn-primary">+ Mouvement</button>
          )}
          <button onClick={fetchData} className="btn-secondary">Actualiser</button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800">⚠ Alertes de stock bas</h3>
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

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'stock' ? 'bg-lcg-500 text-white' : 'bg-gray-100'}`}>Stock actuel</button>
        <button onClick={() => setTab('movements')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'movements' ? 'bg-lcg-500 text-white' : 'bg-gray-100'}`}>Mouvements</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
        ) : tab === 'stock' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Produit</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Lieu</th>
                  <th className="py-3 px-2 text-right">Quantité</th>
                  <th className="py-3 px-2 text-right">Stock min</th>
                  <th className="py-3 px-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{s.product.name}</td>
                    <td className="py-3 px-2 text-xs">{s.product.type}</td>
                    <td className="py-3 px-2">{s.pointOfSale?.name || s.depot?.name || '—'}</td>
                    <td className="py-3 px-2 text-right font-bold">{s.quantity}</td>
                    <td className="py-3 px-2 text-right">{s.product.minStockLevel}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${
                        s.quantity <= 0 ? 'bg-red-100 text-red-800' :
                        s.quantity <= s.product.minStockLevel ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {s.quantity <= 0 ? 'Rupture' : s.quantity <= s.product.minStockLevel ? 'Faible' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Produit</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2 text-right">Qté</th>
                  <th className="py-3 px-2">Motif</th>
                  <th className="py-3 px-2">Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m: any) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-2">{m.product?.name}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${m.type === 'ENTRÉE' ? 'bg-green-100 text-green-800' : m.type === 'SORTIE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">{m.quantity}</td>
                    <td className="py-3 px-2 text-xs">{m.reason || '—'}</td>
                    <td className="py-3 px-2">{m.user?.firstName} {m.user?.lastName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdjust && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Mouvement de stock</h2>
            <form onSubmit={handleAdjust} className="space-y-4">
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
              <div className="flex gap-3 justify-end">
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
