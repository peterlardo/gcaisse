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
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Commandes clients</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle commande
        </button>
      </div>

      {pendingOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="font-semibold text-blue-800">Commandes en cours ({pendingOrders.length})</h3>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="loader">
            <div className="loader-spinner" />
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="empty-state-title">Aucune commande</p>
            <p className="empty-state-text">Créez une commande client pour commencer.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Réf</th>
                <th>Client</th>
                <th>Date</th>
                <th>Livraison</th>
                <th className="text-right">Total</th>
                <th>Statut</th>
                <th>Créée par</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.reference}</td>
                  <td>{o.client?.name}</td>
                  <td className="text-xs">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="text-xs">{o.deliveryDate ? formatDate(o.deliveryDate) : '—'}</td>
                  <td className="text-right font-bold">{formatCurrency(o.total)}</td>
                  <td>
                    <span className={`badge ${getStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span>
                  </td>
                  <td className="text-xs">{o.user?.firstName} {o.user?.lastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Nouvelle commande</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
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
              </div>
              <div className="modal-footer">
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
