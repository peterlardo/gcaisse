'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { downloadExcel } from '@/lib/export'

export default function CreditsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients((data.clients || []).filter((c: any) => c.creditBalance > 0)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchSales = async (clientId: number) => {
    const res = await fetch(`/api/sales?clientId=${clientId}&limit=100`)
    if (res.ok) {
      const data = await res.json()
      setSales(data.sales || [])
    }
  }

  const openClient = (c: any) => {
    setSelectedClient(c)
    setPaymentAmount('')
    fetchSales(c.id)
  }

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) { toast.error('Montant invalide'); return }
    if (parseFloat(paymentAmount) > selectedClient.creditBalance) { toast.error('Montant supérieur au crédit'); return }
    setPaying(true)
    const res = await fetch(`/api/clients/${selectedClient.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reduceCredit: parseFloat(paymentAmount) }),
    })
    if (res.ok) {
      toast.success('Paiement enregistré')
      const newBalance = selectedClient.creditBalance - parseFloat(paymentAmount)
      setSelectedClient({ ...selectedClient, creditBalance: newBalance })
      setClients(clients.map(c => c.id === selectedClient.id ? { ...c, creditBalance: newBalance } : c))
      setPaymentAmount('')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Erreur')
    }
    setPaying(false)
  }

  const totalCredits = clients.reduce((s, c) => s + c.creditBalance, 0)

  if (!user) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Suivi des créances</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExcel('clients')} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card"><p className="stat-label">Total des créances</p><p className="stat-value text-amber-600">{totalCredits.toLocaleString('fr-FR')} FCFA</p></div>
        <div className="stat-card"><p className="stat-label">Clients concernés</p><p className="stat-value">{clients.length}</p></div>
        <div className="stat-card"><p className="stat-label">Moyenne par client</p><p className="stat-value">{clients.length > 0 ? (totalCredits / clients.length).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : 0} FCFA</p></div>
      </div>

      <input type="text" className="input-field max-w-md" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div className="loader py-12"><div className="loader-spinner" /></div>
      ) : clients.length === 0 ? (
        <div className="empty-state py-12"><p className="empty-state-title">Aucune créance</p><p className="empty-state-text">Tous les clients ont soldé leur compte.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients
            .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
            .map(client => (
              <button key={client.id} onClick={() => openClient(client)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left hover:shadow-md transition-all hover:border-amber-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-400">{client.phone || '—'}</p>
                  </div>
                  <span className="text-amber-600 font-bold text-lg">{client.creditBalance.toLocaleString('fr-FR')}</span>
                </div>
                <span className="text-xs text-gray-400">{client.type === 'PARTICULIER' ? 'Particulier' : 'Professionnel'}</span>
              </button>
            ))}
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedClient(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedClient.name}</h2>
                  <p className="text-sm text-gray-400">{selectedClient.phone} · {selectedClient.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Crédit restant</p>
                  <p className="text-2xl font-bold text-amber-600">{selectedClient.creditBalance.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input type="number" className="input-field flex-1" placeholder="Montant du paiement..." value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} min="1" max={selectedClient.creditBalance} />
                <button onClick={handlePayment} disabled={paying || !paymentAmount} className="btn-primary whitespace-nowrap">
                  {paying ? '...' : 'Encaisser'}
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-sm text-gray-500 mb-3 uppercase tracking-wider">Historique des ventes</h3>
              {sales.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune vente</p>
              ) : (
                <div className="space-y-2">
                  {sales.slice(0, 20).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{s.reference}</p>
                        <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString('fr-FR')} · {s.status}</p>
                      </div>
                      <p className="text-sm font-semibold">{s.total.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
