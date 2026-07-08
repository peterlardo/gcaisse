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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Production</h1>
        <div className="flex gap-2">
          {['ADMIN', 'RESPONSABLE_PRODUCTION'].includes(user?.role || '') && (
            <button onClick={() => setShowModal(true)} className="btn-primary">+ Nouveau lot</button>
          )}
          <button onClick={fetchData} className="btn-secondary">Actualiser</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-stat bg-blue-50 border-blue-200">
          <div><p className="text-xs text-gray-500">Total produit</p><p className="text-xl font-bold mt-1">{totalProduced} sacs</p></div>
        </div>
        <div className="card-stat bg-green-50 border-green-200">
          <div><p className="text-xs text-gray-500">Lots enregistrés</p><p className="text-xl font-bold mt-1">{batches.length}</p></div>
        </div>
        <div className="card-stat bg-red-50 border-red-200">
          <div><p className="text-xs text-gray-500">Pertes totales</p><p className="text-xl font-bold mt-1">{totalLost} sacs</p></div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Lots de production</h3>
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
        ) : (
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
                  <th className="py-3 px-2">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b: any) => (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-mono text-xs">{b.batchNumber}</td>
                    <td className="py-3 px-2">{b.product?.name}</td>
                    <td className="py-3 px-2">{formatDateTime(b.productionDate)}</td>
                    <td className="py-3 px-2 text-right font-bold">{b.quantityProduced}</td>
                    <td className="py-3 px-2 text-right text-red-600">{b.quantityLost > 0 ? b.quantityLost : '—'}</td>
                    <td className="py-3 px-2">{b.destinationDepot?.name || '—'}</td>
                    <td className="py-3 px-2">{b.user?.firstName} {b.user?.lastName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Nouveau lot de production</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex gap-3 justify-end">
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
