'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatDateTime, formatCurrency, getOrderStatusLabel, getStatusColor } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_ACTIONS: Record<string, { label: string; action: string; color: string; roles: string[] }[]> = {
  EN_ATTENTE: [
    { label: 'Confirmer', action: 'CONFIRMÉE', color: 'btn-primary', roles: ['ADMIN', 'DIRECTION', 'CAISSIER'] },
    { label: 'Annuler', action: 'ANNULÉE', color: 'btn-danger', roles: ['ADMIN', 'DIRECTION'] },
  ],
  CONFIRMÉE: [
    { label: 'Préparer', action: 'EN_PRÉPARATION', color: 'btn-primary', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
    { label: 'Annuler', action: 'ANNULÉE', color: 'btn-danger', roles: ['ADMIN', 'DIRECTION'] },
  ],
  EN_PRÉPARATION: [
    { label: 'Livrer', action: 'LIVRÉE', color: 'btn-success', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
    { label: 'Annuler', action: 'ANNULÉE', color: 'btn-danger', roles: ['ADMIN', 'DIRECTION'] },
  ],
}

export default function CommandesPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [detailOrder, setDetailOrder] = useState<any>(null)

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

  const handleAction = async (orderId: number, action: string) => {
    const confirmMsg = {
      CONFIRMÉE: 'Confirmer cette commande ?',
      EN_PRÉPARATION: 'Passer cette commande en préparation ?',
      LIVRÉE: 'Marquer cette commande comme livrée ?',
      ANNULÉE: 'Annuler cette commande ?',
    }[action]
    if (confirmMsg && !confirm(confirmMsg)) return

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    if (res.ok) {
      toast.success(`Commande ${getOrderStatusLabel(action)}`)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'EN_ATTENTE' || o.status === 'CONFIRMÉE')
  const totalEnAttente = orders.filter(o => o.status === 'EN_ATTENTE').length
  const totalConfirmées = orders.filter(o => o.status === 'CONFIRMÉE').length
  const totalLivrées = orders.filter(o => o.status === 'LIVRÉE').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Commandes clients</h1>
          <p className="text-sm text-gray-400 mt-1">{orders.length} commande(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle commande
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">En attente</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{totalEnAttente}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Confirmées</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{totalConfirmées}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Livrées</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{totalLivrées}</p>
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
              <p className="text-xs text-gray-400 font-medium">Total</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(orders.reduce((s, o) => s + o.total, 0))}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="loader"><div className="loader-spinner" /></div>
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
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="cursor-pointer" onClick={() => setDetailOrder(o)}>
                  <td className="font-mono text-xs">{o.reference}</td>
                  <td className="font-medium">{o.client?.name}</td>
                  <td className="text-xs">{formatDateTime(o.createdAt)}</td>
                  <td className="text-xs">{o.deliveryDate ? formatDate(o.deliveryDate) : '—'}</td>
                  <td className="text-right font-bold">{formatCurrency(o.total)}</td>
                  <td>
                    <span className={`badge ${getStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span>
                  </td>
                  <td className="text-xs">{o.user?.firstName} {o.user?.lastName}</td>
                  <td className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {(STATUS_ACTIONS[o.status] || []).map(actionDef =>
                        actionDef.roles.includes(user?.role || '') && (
                          <button
                            key={actionDef.action}
                            onClick={() => handleAction(o.id, actionDef.action)}
                            className={`${actionDef.color} btn-sm text-xs`}
                          >
                            {actionDef.label}
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lcg-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-lcg-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Nouvelle commande</h2>
                  <p className="text-xs text-gray-400">Créez une commande pour un client</p>
                </div>
              </div>
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
                    <option value="">Sélectionner un client</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Type de client</label>
                    <select name="clientType" className="input-field">
                      <option value="PARTICULIER">Particulier</option>
                      <option value="PROFESSIONNEL">Professionnel</option>
                      <option value="GROSSISTE">Grossiste</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Date livraison</label>
                    <input name="deliveryDate" type="date" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label-field">Adresse de livraison</label>
                  <input name="deliveryAddress" className="input-field" placeholder="Adresse complète" />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-sm">Produits commandés</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {products.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm">{p.name}</span>
                        <input type="hidden" name="productId[]" value={p.id} />
                        <input name="quantity[]" type="number" className="input-field w-20 text-center" placeholder="0" min="0" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-field">Notes</label>
                  <textarea name="notes" className="input-field" rows={2} placeholder="Instructions particulières..." />
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

      {detailOrder && (
        <div className="modal-overlay" onClick={() => setDetailOrder(null)}>
          <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lcg-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-lcg-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{detailOrder.reference}</h2>
                  <p className="text-xs text-gray-400">
                    <span className={`badge ${getStatusColor(detailOrder.status)}`}>{getOrderStatusLabel(detailOrder.status)}</span>
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setDetailOrder(null)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Client</p>
                  <p className="font-medium">{detailOrder.client?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Date de commande</p>
                  <p className="font-medium">{formatDateTime(detailOrder.createdAt)}</p>
                </div>
                {detailOrder.deliveryDate && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Date livraison</p>
                    <p className="font-medium">{formatDate(detailOrder.deliveryDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Créée par</p>
                  <p className="font-medium">{detailOrder.user?.firstName} {detailOrder.user?.lastName}</p>
                </div>
                {detailOrder.deliveryAddress && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Adresse de livraison</p>
                    <p className="font-medium">{detailOrder.deliveryAddress}</p>
                  </div>
                )}
                {detailOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                    <p className="text-sm text-gray-600">{detailOrder.notes}</p>
                  </div>
                )}
              </div>

              <hr className="border-gray-200" />
              <h4 className="font-semibold text-sm">Produits</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="text-center">Qté</th>
                    <th className="text-right">Prix unit.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailOrder.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="text-sm">{item.product?.name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right font-bold text-sm">Total</td>
                    <td className="text-right font-bold text-sm">{formatCurrency(detailOrder.total)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="flex justify-end gap-2 pt-2">
                {(STATUS_ACTIONS[detailOrder.status] || []).map(actionDef =>
                  actionDef.roles.includes(user?.role || '') && (
                    <button
                      key={actionDef.action}
                      onClick={() => { handleAction(detailOrder.id, actionDef.action); setDetailOrder(null) }}
                      className={`${actionDef.color} btn-sm`}
                    >
                      {actionDef.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
