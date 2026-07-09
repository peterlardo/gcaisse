'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function DepotsPage() {
  const { user } = useAuth()
  const [depots, setDepots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/depots')
      const data = await res.json()
      setDepots(data.depots || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredDepots = depots.filter((d: any) =>
    !searchTerm || `${d.name} ${d.code} ${d.city} ${d.address || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)
    if (editing) (data as any).id = editing.id

    const res = await fetch('/api/depots', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success(editing ? 'Dépôt modifié' : 'Dépôt créé')
      setShowModal(false)
      setEditing(null)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Désactiver ce dépôt ?')) return
    const res = await fetch(`/api/depots?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Dépôt désactivé')
      fetchData()
    } else {
      toast.error('Erreur')
    }
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'DIRECTION'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dépôts</h1>
          <p className="text-sm text-gray-400 mt-1">{depots.length} dépôt(s) enregistré(s)</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditing(null); setShowModal(true) }} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau dépôt
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Rechercher un dépôt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card">
          <div className="loader"><div className="loader-spinner" /></div>
        </div>
      ) : filteredDepots.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="empty-state-title">Aucun dépôt</p>
            <p className="empty-state-text">Créez un premier dépôt pour commencer.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Ville</th>
                <th>Adresse</th>
                <th className="text-center">Distributions</th>
                <th className="text-center">Mouvements</th>
                <th>Statut</th>
                {canEdit && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDepots.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                      </div>
                      <span className="text-sm">{d.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{d.code}</td>
                  <td>{d.city}</td>
                  <td className="text-sm text-gray-500 max-w-[200px] truncate">{d.address || '—'}</td>
                  <td className="text-center">{d._count?.distributions || 0}</td>
                  <td className="text-center">{d._count?.stockMovements || 0}</td>
                  <td>
                    <span className={d.isActive ? 'badge-success' : 'badge-danger'}>
                      {d.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(d); setShowModal(true) }}
                          className="btn-ghost btn-sm p-1.5 text-gray-400 hover:text-amber-600"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="btn-ghost btn-sm p-1.5 text-gray-400 hover:text-red-600"
                            title="Désactiver"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{editing ? 'Modifier le dépôt' : 'Nouveau dépôt'}</h2>
                  <p className="text-xs text-gray-400">{editing ? 'Modifiez les informations ci-dessous' : 'Ajoutez un nouveau dépôt'}</p>
                </div>
              </div>
              <button type="button" onClick={() => { setShowModal(false); setEditing(null) }} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Nom</label>
                    <input name="name" className="input-field" required defaultValue={editing?.name || ''} />
                  </div>
                  <div>
                    <label className="label-field">Code</label>
                    <input name="code" className="input-field" required defaultValue={editing?.code || ''} />
                  </div>
                </div>
                <div>
                  <label className="label-field">Adresse</label>
                  <input name="address" className="input-field" defaultValue={editing?.address || ''} />
                </div>
                <div>
                  <label className="label-field">Ville</label>
                  <input name="city" className="input-field" defaultValue={editing?.city || 'Brazzaville'} />
                </div>
                {editing && (
                  <div className="flex items-center gap-3">
                    <label className="label-field mb-0">Actif</label>
                    <select name="isActive" className="input-field w-auto" defaultValue={editing?.isActive ? 'true' : 'false'}>
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null) }} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
