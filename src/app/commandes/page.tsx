'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatCurrency, getOrderStatusLabel, getStatusColor } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function CommandesPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordRes, clientRes, prodRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/clients'),
        fetch('/api/products?active=true'),
      ])
      setOrders((await ordRes.json()).orders || [])
      setClients((await clientRes.json()).clients || [])
      setProducts((await prodRes.json()).products || [])
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
      quantity: parseInt(quantities[i] as string) || 1,
    })).filter(item => item.quantity > 0)

    if (items.length === 0) { toast.error('Ajoutez au moins un produit'); return }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: parseInt(form.get('clientId') as string),
        clientType: form.get('clientType') || 'PARTICULIER',
        deliveryAddress: form.get('deliveryAddress') as string,
        deliveryDate: form.get('deliveryDate') as string,
        notes: form.get('notes') as string,
        items,
      }),
    })

    if (res.ok) {
      toast.success('Commande créée')
      setShowModal(false)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'EN_ATTENTE' || o.status === 'CONFIRMÉE')

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Commandes clients</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Nouvelle commande</button>
      </div>

      {pendingOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800">📋 Commandes en cours ({pendingOrders.length})</h3>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Réf</th>
                  <th className="py-3 px-2">Client</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Livraison</th>
                  <th className="py-3 px-2 text-right">Total</th>
                  <th className="py-3 px-2">Statut</th>
                  <th className="py-3 px-2">Créée par</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-mono text-xs">{o.reference}</td>
                    <td className="py-3 px-2">{o.client?.name}</td>
                    <td className="py-3 px-2 text-xs">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-2 text-xs">{o.deliveryDate ? formatDate(o.deliveryDate) : '—'}</td>
                    <td className="py-3 px-2 text-right font-bold">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${getStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span>
                    </td>
                    <td className="py-3 px-2 text-xs">{o.user?.firstName} {o.user?.lastName}</td>
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
            <h2 className="text-xl font-bold mb-4">Nouvelle commande</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label-field">Client</label>
                <select name="clientId" className="input-field" required>
                  <option value="">Sélectionner</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Type de client</label>
                <select name="clientType" className="input-field">
                  <option value="PARTICULIER">Particulier</option>
                  <option value="PROFESSIONNEL">Professionnel</option>
                  <option value="GROSSISTE">Grossiste</option>
                </select>
              </div>
              <div>
                <label className="label-field">Adresse de livraison</label>
                <input name="deliveryAddress" className="input-field" />
              </div>
              <div>
                <label className="label-field">Date de livraison souhaitée</label>
                <input name="deliveryDate" type="date" className="input-field" />
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Produits</h4>
                {products.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 mb-2">
                    <span className="flex-1 text-sm">{p.name}</span>
                    <input type="number" name="productId[]" value={p.id} className="hidden" readOnly />
                    <input name="quantity[]" type="number" className="input-field w-20" placeholder="Qté" min="0" />
                  </div>
                ))}
              </div>
              <div>
                <label className="label-field">Notes</label>
                <textarea name="notes" className="input-field" rows={2}></textarea>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Créer la commande</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
