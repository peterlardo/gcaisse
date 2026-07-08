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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Distribution</h1>
        {['ADMIN', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_STOCK'].includes(user?.role || '') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Nouvelle distribution</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-stat bg-blue-50 border-blue-200">
          <div><p className="text-xs text-gray-500">Total distributions</p><p className="text-xl font-bold mt-1">{distributions.length}</p></div>
        </div>
        <div className="card-stat bg-yellow-50 border-yellow-200">
          <div><p className="text-xs text-gray-500">En préparation</p><p className="text-xl font-bold mt-1">{distributions.filter(d => d.status === 'EN_PRÉPARATION').length}</p></div>
        </div>
        <div className="card-stat bg-green-50 border-green-200">
          <div><p className="text-xs text-gray-500">Livrées</p><p className="text-xl font-bold mt-1">{distributions.filter(d => d.status === 'LIVRÉ').length}</p></div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Distributions</h3>
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Réf</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Source</th>
                  <th className="py-3 px-2">Produits</th>
                  <th className="py-3 px-2">Statut</th>
                  <th className="py-3 px-2">Responsable</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((d: any) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-mono text-xs">{d.reference}</td>
                    <td className="py-3 px-2">{formatDateTime(d.createdAt)}</td>
                    <td className="py-3 px-2">{d.sourceDepot?.name}</td>
                    <td className="py-3 px-2">
                      {d.items?.map((i: any) => `${i.product?.name} (x${i.quantitySent})`).join(', ')}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`badge ${getStatusColor(d.status)}`}>{getDistributionStatusLabel(d.status)}</span>
                    </td>
                    <td className="py-3 px-2">{d.user?.firstName} {d.user?.lastName}</td>
                    <td className="py-3 px-2">
                      {d.status === 'EN_PRÉPARATION' && (
                        <button onClick={() => handleValidate(d.id)} className="text-green-600 text-xs hover:underline">Valider</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Nouvelle distribution</h2>
            <form onSubmit={handleCreate} className="space-y-4">
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
              <div className="flex gap-3 justify-end">
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
