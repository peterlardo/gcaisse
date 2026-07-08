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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Administration</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {['users', 'settings'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t ? 'bg-lcg-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t === 'users' ? '👥 Utilisateurs' : '⚙️ Paramètres'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Gestion des utilisateurs</h3>
            <button onClick={() => setShowUserModal(true)} className="btn-primary">+ Ajouter</button>
          </div>

          {loading ? (
            <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 px-2">Nom</th>
                    <th className="py-3 px-2">Identifiant</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Rôle</th>
                    <th className="py-3 px-2">Point de vente</th>
                    <th className="py-3 px-2">Statut</th>
                    <th className="py-3 px-2">Dernière connexion</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="py-3 px-2 font-mono text-xs">{u.username}</td>
                      <td className="py-3 px-2">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${
                          u.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          u.role === 'DIRECTION' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'RESPONSABLE_STOCK' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'RESPONSABLE_PRODUCTION' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>{u.role}</span>
                      </td>
                      <td className="py-3 px-2">{u.pointOfSale?.name || '—'}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}</td>
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
          <h3 className="font-semibold mb-4">Paramètres généraux</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><p className="font-medium">Sauvegarde automatique</p><p className="text-xs text-gray-500">Activée par défaut</p></div>
              <span className="badge bg-green-100 text-green-800">Activée</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><p className="font-medium">Version du logiciel</p><p className="text-xs text-gray-500">Dernière mise à jour</p></div>
              <span className="text-sm font-mono">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><p className="font-medium">Base de données</p><p className="text-xs text-gray-500">SQLite (dev) / PostgreSQL (prod)</p></div>
              <span className="text-sm">✅ Connectée</span>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Nouvel utilisateur</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Prénom</label><input name="firstName" className="input-field" required /></div>
                <div><label className="label-field">Nom</label><input name="lastName" className="input-field" required /></div>
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
              <div className="flex gap-3 justify-end">
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
