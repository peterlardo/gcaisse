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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Réservations</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Nouvelle réservation</button>
      </div>

      {upcomingReservations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800">📅 Réservations à venir ({upcomingReservations.length})</h3>
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
                  <th className="py-3 px-2">Produits</th>
                  <th className="py-3 px-2">Statut</th>
                  <th className="py-3 px-2">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r: any) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-mono text-xs">{r.reference}</td>
                    <td className="py-3 px-2">{r.client?.name}</td>
                    <td className="py-3 px-2">{formatDate(r.scheduledDate)} {r.scheduledTime || ''}</td>
                    <td className="py-3 px-2 text-xs">
                      {r.items?.map((i: any) => `${i.product?.name} x${i.quantity}`).join(', ')}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`badge ${getStatusColor(r.status)}`}>{getReservationStatusLabel(r.status)}</span>
                    </td>
                    <td className="py-3 px-2 text-xs">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
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
            <h2 className="text-xl font-bold mb-4">Nouvelle réservation</h2>
            <form onSubmit={handleCreate} className="space-y-4">
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
              <div className="flex gap-3 justify-end">
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
