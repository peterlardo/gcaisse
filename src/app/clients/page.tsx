'use client'

import { useState, useEffect } from 'react'
import { getClientTypeLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data.clients || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('Client créé')
      setShowModal(false)
      fetchClients()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Nouveau client</button>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            className="input-field"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchClients()}
          />
          <button onClick={fetchClients} className="btn-primary">Rechercher</button>
        </div>

        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Nom</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Téléphone</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Ville</th>
                  <th className="py-3 px-2 text-right">Achats</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{c.name}</td>
                    <td className="py-3 px-2"><span className="badge bg-blue-100 text-blue-800">{getClientTypeLabel(c.type)}</span></td>
                    <td className="py-3 px-2">{c.phone || '—'}</td>
                    <td className="py-3 px-2">{c.email || '—'}</td>
                    <td className="py-3 px-2">{c.city}</td>
                    <td className="py-3 px-2 text-right">{c._count?.sales || 0} ventes</td>
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
            <h2 className="text-xl font-bold mb-4">Nouveau client</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label-field">Nom / Raison sociale</label>
                <input name="name" className="input-field" required />
              </div>
              <div>
                <label className="label-field">Type</label>
                <select name="type" className="input-field">
                  <option value="PARTICULIER">Particulier</option>
                  <option value="PROFESSIONNEL">Professionnel</option>
                  <option value="GROSSISTE">Grossiste</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Téléphone</label>
                  <input name="phone" className="input-field" />
                </div>
                <div>
                  <label className="label-field">Email</label>
                  <input name="email" type="email" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label-field">Adresse</label>
                <input name="address" className="input-field" />
              </div>
              <div>
                <label className="label-field">Ville</label>
                <input name="city" className="input-field" defaultValue="Brazzaville" />
              </div>
              <div>
                <label className="label-field">Notes</label>
                <textarea name="notes" className="input-field" rows={2}></textarea>
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
