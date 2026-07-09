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
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau client
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchClients()}
            />
          </div>
          <button onClick={fetchClients} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Rechercher
          </button>
        </div>

        {loading ? (
          <div className="loader">
            <div className="loader-spinner" />
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="empty-state-title">Aucun client</p>
            <p className="empty-state-text">Créez votre premier client ou modifiez votre recherche.</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Ville</th>
                  <th className="text-right">Achats</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c: any) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td><span className="badge-info">{getClientTypeLabel(c.type)}</span></td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.city}</td>
                    <td className="text-right">{c._count?.sales || 0} ventes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Nouveau client</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
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
              </div>
              <div className="modal-footer">
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
