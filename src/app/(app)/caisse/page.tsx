'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function CaissePage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [caisses, setCaisses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showOpen, setShowOpen] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sessionRes, caisseRes] = await Promise.all([
        fetch('/api/caisse/sessions'),
        fetch('/api/caisses'),
      ])
      const sessionData = await sessionRes.json()
      const caisseData = await caisseRes.json()
      setSessions(sessionData.sessions || [])
      setCaisses(caisseData.caisses || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    const res = await fetch('/api/caisse/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('Session de caisse ouverte')
      setShowOpen(false)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const handleCloseSession = async (sessionId: number) => {
    const closingBalance = prompt('Solde de clôture (encaissements du jour):')
    if (!closingBalance) return

    const res = await fetch(`/api/caisse/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLOSE', closingBalance }),
    })

    if (res.ok) {
      toast.success('Session fermée')
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const openSession = sessions.find((s: any) => s.status === 'OUVERTE')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Caisse</h1>
        <div className="flex gap-2">
          {!openSession && ['CAISSIER', 'ADMIN'].includes(user?.role || '') && (
            <button onClick={() => setShowOpen(true)} className="btn-success">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ouvrir une session
            </button>
          )}
          {openSession && (
            <button onClick={() => handleCloseSession(openSession.id)} className="btn-danger">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Fermer la session
            </button>
          )}
          <button onClick={fetchData} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {openSession && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-emerald-800">Session ouverte</h3>
          </div>
          <p className="text-sm text-emerald-600 mt-1 ml-7">
            Caisse: {openSession.caisse?.name} | Ouverte le {formatDateTime(openSession.openedAt)} |
            Solde initial: {formatCurrency(openSession.openingBalance)}
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Sessions de caisse</h3>
        {loading ? (
          <div className="loader">
            <div className="loader-spinner" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="empty-state-title">Aucune session</p>
            <p className="empty-state-text">Ouvrez une session de caisse pour commencer.</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Caisse</th>
                  <th>Utilisateur</th>
                  <th>Ouverture</th>
                  <th>Fermeture</th>
                  <th className="text-right">Solde ouverture</th>
                  <th className="text-right">Solde clôture</th>
                  <th className="text-right">Écart</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id}>
                    <td>{s.caisse?.name}</td>
                    <td>{s.user?.firstName} {s.user?.lastName}</td>
                    <td>{formatDateTime(s.openedAt)}</td>
                    <td>{s.closedAt ? formatDateTime(s.closedAt) : '—'}</td>
                    <td className="text-right">{formatCurrency(s.openingBalance)}</td>
                    <td className="text-right">{s.closingBalance ? formatCurrency(s.closingBalance) : '—'}</td>
                    <td className={`text-right font-bold ${s.difference && s.difference !== 0 ? 'text-red-600' : ''}`}>
                      {s.difference ? formatCurrency(s.difference) : '—'}
                    </td>
                    <td>
                      <span className={s.status === 'OUVERTE' ? 'badge-success' : 'badge-neutral'}>
                        {s.status === 'OUVERTE' ? 'Ouverte' : 'Fermée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Ouvrir une session de caisse</h2>
              <button type="button" onClick={() => setShowOpen(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleOpenSession}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label-field">Caisse</label>
                  <select name="caisseId" className="input-field" required>
                    {caisses.filter((c: any) => c.isActive).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.pointOfSale?.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">Solde d'ouverture (fond de caisse)</label>
                  <input name="openingBalance" type="number" className="input-field" required defaultValue="0" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowOpen(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-success">Ouvrir la session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
