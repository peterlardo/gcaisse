'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function ConnexionsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/login-logs?page=${page}&limit=30`)
      .then(res => res.json())
      .then(data => { setLogs(data.logs || []); setTotalPages(data.totalPages || 1) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  if (user?.role !== 'ADMIN') {
    return <div className="text-center py-12"><p className="text-gray-500 font-medium">Accès réservé à l'administrateur</p></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Historique des connexions</h1>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loader py-12"><div className="loader-spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state py-12">
            <p className="empty-state-title">Aucune connexion</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead><tr><th>Date</th><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>IP</th><th>Statut</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString('fr-FR')} <span className="text-gray-400">{new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td className="text-sm font-medium">{log.user.firstName} {log.user.lastName}</td>
                    <td className="text-xs text-gray-500">{log.user.email}</td>
                    <td><span className="badge-info">{log.user.role.replace(/_/g, ' ')}</span></td>
                    <td className="text-xs font-mono text-gray-400">{log.ipAddress || '—'}</td>
                    <td>{log.success ? <span className="badge-success">Succès</span> : <span className="badge-danger">Échec</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm">Précédent</button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm">Suivant</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
