'use client'

import { useState, useEffect } from 'react'
import { formatDate, getReservationStatusLabel, getStatusColor } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function ReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resRes, clientRes, prodRes] = await Promise.all([
        fetch('/api/reservations'),
        fetch('/api/clients'),
        fetch('/api/products?active=true'),
      ])
      setReservations((await resRes.json()).reservations || [])
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

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: parseInt(form.get('clientId') as string),
        scheduledDate: form.get('scheduledDate') as string,
        scheduledTime: form.get('scheduledTime') as string,
        notes: form.get('notes') as string,
        items,
      }),
    })

    if (res.ok) {
      toast.success('Réservation créée')
      setShowModal(false)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const upcomingReservations = reservations.filter(r => r.status === 'EN_ATTENTE' || r.status === 'CONFIRMÉE')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Réservations</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle réservation
        </button>
      </div>

      {upcomingReservations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-semibold text-amber-800">Réservations à venir ({upcomingReservations.length})</h3>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="loader">
            <div className="loader-spinner" />
          </div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="empty-state-title">Aucune réservation</p>
            <p className="empty-state-text">Créez une nouvelle réservation pour un client.</p>
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
                <th>Produits</th>
                <th>Statut</th>
                <th>Créée le</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.reference}</td>
                  <td>{r.client?.name}</td>
                  <td>{formatDate(r.scheduledDate)} {r.scheduledTime || ''}</td>
                  <td className="text-xs">
                    {r.items?.map((i: any) => `${i.product?.name} x${i.quantity}`).join(', ')}
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(r.status)}`}>{getReservationStatusLabel(r.status)}</span>
                  </td>
                  <td className="text-xs">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
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
              <h2 className="text-lg font-bold">Nouvelle réservation</h2>
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
                    <label className="label-field">Date souhaitée</label>
                    <input name="scheduledDate" type="date" className="input-field" required />
                  </div>
                  <div>
                    <label className="label-field">Heure</label>
                    <input name="scheduledTime" type="time" className="input-field" />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Produits réservés</h4>
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
                <button type="submit" className="btn-primary">Créer la réservation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
