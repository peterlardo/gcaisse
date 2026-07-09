'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function AdministrationPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => { if (user?.role === 'ADMIN') fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('Utilisateur créé')
      setShowUserModal(false)
      fetchUsers()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Accès réservé à l'administrateur</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Administration</h1>
      </div>

      <div className="tabs">
        <button onClick={() => setTab('users')} className={tab === 'users' ? 'tab-active' : 'tab'}>
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          Utilisateurs
        </button>
        <button onClick={() => setTab('settings')} className={tab === 'settings' ? 'tab-active' : 'tab'}>
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Paramètres
        </button>
      </div>

      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Gestion des utilisateurs</h3>
            <button onClick={() => setShowUserModal(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </div>

          {loading ? (
            <div className="loader">
              <div className="loader-spinner" />
            </div>
          ) : (
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Identifiant</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Point de vente</th>
                    <th>Statut</th>
                    <th>Dernière connexion</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.firstName} {u.lastName}</td>
                      <td className="font-mono text-xs">{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'ADMIN' ? 'badge-danger' :
                          u.role === 'DIRECTION' ? 'badge-info' :
                          u.role === 'RESPONSABLE_STOCK' ? 'badge-info' :
                          u.role === 'RESPONSABLE_PRODUCTION' ? 'badge-warning' :
                          'badge-success'
                        }`}>{u.role}</span>
                      </td>
                      <td>{u.pointOfSale?.name || '—'}</td>
                      <td>
                        <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Paramètres généraux</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium">Sauvegarde automatique</p>
                <p className="text-xs text-gray-500">Activée par défaut</p>
              </div>
              <span className="badge-success">Activée</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium">Version du logiciel</p>
                <p className="text-xs text-gray-500">Dernière mise à jour</p>
              </div>
              <span className="text-sm font-mono">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium">Base de données</p>
                <p className="text-xs text-gray-500">SQLite (dev) / PostgreSQL (prod)</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connectée
              </div>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Nouvel utilisateur</h2>
              <button type="button" onClick={() => setShowUserModal(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Prénom</label>
                    <input name="firstName" className="input-field" required />
                  </div>
                  <div>
                    <label className="label-field">Nom</label>
                    <input name="lastName" className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="label-field">Nom d'utilisateur</label>
                  <input name="username" className="input-field" required />
                </div>
                <div>
                  <label className="label-field">Email</label>
                  <input name="email" type="email" className="input-field" required />
                </div>
                <div>
                  <label className="label-field">Mot de passe</label>
                  <input name="password" type="password" className="input-field" required />
                </div>
                <div>
                  <label className="label-field">Rôle</label>
                  <select name="role" className="input-field">
                    <option value="CAISSIER">Caissier / Vendeur</option>
                    <option value="RESPONSABLE_STOCK">Responsable de stock</option>
                    <option value="RESPONSABLE_PRODUCTION">Responsable de production</option>
                    <option value="DIRECTION">Direction</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Téléphone</label>
                  <input name="phone" className="input-field" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
