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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Caisse</h1>
        <div className="flex gap-2">
          {!openSession && ['CAISSIER', 'ADMIN'].includes(user?.role || '') && (
            <button onClick={() => setShowOpen(true)} className="btn-success">+ Ouvrir une session</button>
          )}
          {openSession && (
            <button onClick={() => handleCloseSession(openSession.id)} className="btn-danger">Fermer la session</button>
          )}
          <button onClick={fetchData} className="btn-secondary">Actualiser</button>
        </div>
      </div>

      {openSession && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-semibold text-green-800">Session ouverte</h3>
          <p className="text-sm text-green-600 mt-1">
            Caisse: {openSession.caisse?.name} | Ouverte le {formatDateTime(openSession.openedAt)} |
            Solde initial: {formatCurrency(openSession.openingBalance)}
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold mb-4">Sessions de caisse</h3>
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Caisse</th>
                  <th className="py-3 px-2">Utilisateur</th>
                  <th className="py-3 px-2">Ouverture</th>
                  <th className="py-3 px-2">Fermeture</th>
                  <th className="py-3 px-2 text-right">Solde ouverture</th>
                  <th className="py-3 px-2 text-right">Solde clôture</th>
                  <th className="py-3 px-2 text-right">Écart</th>
                  <th className="py-3 px-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{s.caisse?.name}</td>
                    <td className="py-3 px-2">{s.user?.firstName} {s.user?.lastName}</td>
                    <td className="py-3 px-2">{formatDateTime(s.openedAt)}</td>
                    <td className="py-3 px-2">{s.closedAt ? formatDateTime(s.closedAt) : '—'}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(s.openingBalance)}</td>
                    <td className="py-3 px-2 text-right">{s.closingBalance ? formatCurrency(s.closingBalance) : '—'}</td>
                    <td className={`py-3 px-2 text-right font-bold ${s.difference && s.difference !== 0 ? 'text-red-600' : ''}`}>
                      {s.difference ? formatCurrency(s.difference) : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`badge ${s.status === 'OUVERTE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Ouvrir une session de caisse</h2>
            <form onSubmit={handleOpenSession} className="space-y-4">
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
              <div className="flex gap-3 justify-end">
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
