'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

type Tab = 'plan' | 'ecritures' | 'balance' | 'resultat' | 'bilan'

export default function ComptabilitePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('plan')
  const [accounts, setAccounts] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showCreateEntry, setShowCreateEntry] = useState(false)

  useEffect(() => { if (tab === 'plan') fetchAccounts(); else if (tab === 'ecritures') fetchEntries() }, [tab])

  const fetchAccounts = async () => {
    setLoading(true)
    const res = await fetch('/api/comptabilite/accounts')
    if (res.ok) setAccounts((await res.json()).accounts)
    setLoading(false)
  }

  const fetchEntries = async () => {
    setLoading(true)
    const res = await fetch('/api/comptabilite/entries')
    if (res.ok) setEntries((await res.json()).entries)
    setLoading(false)
  }

  const handleSeed = async () => {
    const res = await fetch('/api/comptabilite/seed', { method: 'POST' })
    if (res.ok) {
      toast.success('Plan comptable créé')
      fetchAccounts()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const rootAccounts = accounts.filter((a: any) => !a.parentId)
  const getChildren = (code: string) => accounts.filter((a: any) => {
    const parent = accounts.find((p: any) => p.id === a.parentId)
    return parent?.code === code
  })

  const tabs: { key: Tab; label: string }[] = [
    { key: 'plan', label: 'Plan comptable' },
    { key: 'ecritures', label: 'Écritures' },
    { key: 'balance', label: 'Balance' },
    { key: 'resultat', label: 'Compte de résultat' },
    { key: 'bilan', label: 'Bilan' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Comptabilité</h1>
        <div className="flex gap-2">
          {tab === 'plan' && accounts.length === 0 && ['ADMIN'].includes(user?.role || '') && (
            <button onClick={handleSeed} className="btn-primary">
              Initialiser le plan comptable
            </button>
          )}
          {tab === 'plan' && ['ADMIN', 'DIRECTION'].includes(user?.role || '') && (
            <button onClick={() => setShowCreateAccount(true)} className="btn-success">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau compte
            </button>
          )}
          {tab === 'ecritures' && ['ADMIN', 'DIRECTION'].includes(user?.role || '') && (
            <button onClick={() => setShowCreateEntry(true)} className="btn-success">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle écriture
            </button>
          )}
          <button onClick={() => { if (tab === 'plan') fetchAccounts(); else fetchEntries() }} className="btn-secondary">
            Actualiser
          </button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab ${tab === t.key ? 'tab-active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plan' && renderPlan(accounts, rootAccounts, getChildren, loading, user, showCreateAccount, setShowCreateAccount, fetchAccounts)}
      {tab === 'ecritures' && renderEntries(entries, loading, user, showCreateEntry, setShowCreateEntry, fetchEntries, accounts)}
      {tab === 'balance' && <BalanceReport accounts={accounts} />}
      {tab === 'resultat' && <ProfitLossReport accounts={accounts} />}
      {tab === 'bilan' && <BalanceSheet accounts={accounts} />}
    </div>
  )
}

function renderPlan(accounts: any[], rootAccounts: any[], getChildren: (code: string) => any[], loading: boolean, user: any, showCreate: boolean, setShowCreate: (v: boolean) => void, onRefresh: () => void) {
  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Plan comptable</h3>
      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="empty-state-title">Aucun compte comptable</p>
          <p className="empty-state-text">Initialisez le plan comptable pour commencer.</p>
        </div>
      ) : (
        <div className="table-container border-0 rounded-none shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Nature</th>
              </tr>
            </thead>
            <tbody>
              {rootAccounts.map((a: any) => (
                <AccountRow key={a.id} account={a} accounts={accounts} depth={0} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateAccountModal accounts={accounts} onClose={() => setShowCreate(false)} onCreated={onRefresh} />
      )}
    </div>
  )
}

function AccountRow({ account, accounts, depth }: { account: any; accounts: any[]; depth: number }) {
  const children = accounts.filter((a: any) => a.parentId === account.id)
  const typeColors: Record<string, string> = { ACTIF: 'text-emerald-600', PASSIF: 'text-blue-600', CHARGE: 'text-red-600', PRODUIT: 'text-green-600' }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="font-mono text-sm" style={{ paddingLeft: `${12 + depth * 20}px` }}>{account.code}</td>
        <td className="font-medium">{account.name}</td>
        <td className={typeColors[account.type] || ''}>{account.type}</td>
        <td>{account.nature === 'DEBIT' ? 'Débit' : 'Crédit'}</td>
      </tr>
      {children.map((c: any) => (
        <AccountRow key={c.id} account={c} accounts={accounts} depth={depth + 1} />
      ))}
    </>
  )
}

function CreateAccountModal({ accounts, onClose, onCreated }: { accounts: any[]; onClose: () => void; onCreated: () => void }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    const res = await fetch('/api/comptabilite/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('Compte créé')
      onClose()
      onCreated()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-lg font-bold">Nouveau compte comptable</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label-field">Code</label>
              <input name="code" className="input-field font-mono" required placeholder="Ex: 601" />
            </div>
            <div>
              <label className="label-field">Nom</label>
              <input name="name" className="input-field" required placeholder="Ex: Achats matières premières" />
            </div>
            <div>
              <label className="label-field">Type</label>
              <select name="type" className="input-field" required>
                <option value="ACTIF">Actif</option>
                <option value="PASSIF">Passif</option>
                <option value="CHARGE">Charge</option>
                <option value="PRODUIT">Produit</option>
              </select>
            </div>
            <div>
              <label className="label-field">Nature (solde normal)</label>
              <select name="nature" className="input-field" required>
                <option value="DEBIT">Débiteur</option>
                <option value="CREDIT">Créditeur</option>
              </select>
            </div>
            <div>
              <label className="label-field">Compte parent (optionnel)</label>
              <select name="parentId" className="input-field">
                <option value="">Aucun</option>
                {accounts.filter((a: any) => a.type).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Créer</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function renderEntries(entries: any[], loading: boolean, user: any, showCreate: boolean, setShowCreate: (v: boolean) => void, onRefresh: () => void, accounts: any[]) {
  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Écritures comptables</h3>
      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="empty-state-title">Aucune écriture</p>
          <p className="empty-state-text">Saisissez une première écriture comptable.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((e: any) => {
            const totalDebit = e.lines.reduce((s: number, l: any) => s + l.debit, 0)
            const totalCredit = e.lines.reduce((s: number, l: any) => s + l.credit, 0)
            return (
              <div key={e.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-lcg-700">{e.reference}</span>
                    <span className="text-sm font-medium">{e.label}</span>
                    {e.validated ? (
                      <span className="badge-success">Validée</span>
                    ) : (
                      <span className="badge-neutral">En attente</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="table-container border-0 rounded-none shadow-none">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Compte</th>
                        <th>Libellé</th>
                        <th className="text-right">Débit</th>
                        <th className="text-right">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.lines.map((l: any) => (
                        <tr key={l.id}>
                          <td className="font-mono text-sm">{l.account.code} - {l.account.name}</td>
                          <td className="text-sm text-gray-500">{l.label || '—'}</td>
                          <td className="text-right">{l.debit > 0 ? formatCurrency(l.debit) : '—'}</td>
                          <td className="text-right">{l.credit > 0 ? formatCurrency(l.credit) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold bg-gray-50">
                        <td colSpan={2}>Totaux</td>
                        <td className="text-right">{formatCurrency(totalDebit)}</td>
                        <td className="text-right">{formatCurrency(totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {!e.validated && ['ADMIN', 'DIRECTION'].includes(user?.role || '') && (
                  <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/50 flex justify-end">
                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/comptabilite/entries/${e.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'VALIDATE' }),
                        })
                        if (res.ok) { toast.success('Écriture validée'); onRefresh() }
                        else { const err = await res.json(); toast.error(err.error || 'Erreur') }
                      }}
                      className="btn-primary btn-sm"
                    >
                      Valider l'écriture
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateEntryModal accounts={accounts} onClose={() => setShowCreate(false)} onCreated={onRefresh} />
      )}
    </div>
  )
}

function CreateEntryModal({ accounts, onClose, onCreated }: { accounts: any[]; onClose: () => void; onCreated: () => void }) {
  const [lines, setLines] = useState([{ accountId: '', label: '', debit: '', credit: '' }])

  const addLine = () => setLines([...lines, { accountId: '', label: '', debit: '', credit: '' }])
  const removeLine = (i: number) => { if (lines.length > 1) setLines(lines.filter((_, idx) => idx !== i)) }
  const updateLine = (i: number, field: string, value: string) => {
    const updated = lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l)
    setLines(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form)

    const res = await fetch('/api/comptabilite/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, lines }),
    })

    if (res.ok) {
      toast.success('Écriture créée')
      onClose()
      onCreated()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <div className="modal-overlay">
      <div className="modal max-w-3xl">
        <div className="modal-header">
          <h2 className="text-lg font-bold">Nouvelle écriture comptable</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Libellé</label>
                <input name="label" className="input-field" required placeholder="Ex: Vente du jour" />
              </div>
              <div>
                <label className="label-field">Date</label>
                <input name="date" type="date" className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div>
              <label className="label-field">Description (optionnelle)</label>
              <textarea name="description" className="input-field" rows={2} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-field mb-0">Lignes d'écriture</label>
                <button type="button" onClick={addLine} className="btn-secondary btn-sm">+ Ajouter une ligne</button>
              </div>
              <div className="table-container border-0 rounded-none shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-2/5">Compte</th>
                      <th>Libellé</th>
                      <th className="text-right w-1/6">Débit</th>
                      <th className="text-right w-1/6">Crédit</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i}>
                        <td>
                          <select
                            value={line.accountId}
                            onChange={(e) => updateLine(i, 'accountId', e.target.value)}
                            className="input-field text-sm"
                            required
                          >
                            <option value="">Sélectionner</option>
                            {accounts.filter((a: any) => a._count?.children === 0 || !a._count).map((a: any) => (
                              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            value={line.label}
                            onChange={(e) => updateLine(i, 'label', e.target.value)}
                            className="input-field text-sm"
                            placeholder="Libellé ligne"
                          />
                        </td>
                        <td>
                          <input
                            value={line.debit}
                            onChange={(e) => updateLine(i, 'debit', e.target.value)}
                            type="number"
                            className="input-field text-sm text-right"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            value={line.credit}
                            onChange={(e) => updateLine(i, 'credit', e.target.value)}
                            type="number"
                            className="input-field text-sm text-right"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td>
                          {lines.length > 1 && (
                            <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold bg-gray-50">
                      <td colSpan={2}>Totaux</td>
                      <td className="text-right">{formatCurrency(totalDebit)}</td>
                      <td className="text-right">{formatCurrency(totalCredit)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={5}>
                        <span className={`text-xs font-medium ${balanced ? 'text-emerald-600' : 'text-red-500'}`}>
                          {balanced ? 'Équilibré ✓' : `Déséquilibré (${formatCurrency(Math.abs(totalDebit - totalCredit))})`}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-success" disabled={!balanced}>
              {balanced ? 'Enregistrer l\'écriture' : 'Déséquilibré'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BalanceReport({ accounts }: { accounts: any[] }) {
  const [report, setReport] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const fetchBalance = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateRange.start) params.set('startDate', dateRange.start)
    if (dateRange.end) params.set('endDate', dateRange.end)
    const res = await fetch(`/api/comptabilite/entries?${params}`)
    if (res.ok) {
      const data = await res.json()
      const entries = data.entries || []
      const balances: Record<number, { account: any; totalDebit: number; totalCredit: number }> = {}

      accounts.forEach((a: any) => {
        balances[a.id] = { account: a, totalDebit: 0, totalCredit: 0 }
      })

      entries.forEach((e: any) => {
        e.lines.forEach((l: any) => {
          if (balances[l.accountId]) {
            balances[l.accountId].totalDebit += l.debit
            balances[l.accountId].totalCredit += l.credit
          }
        })
      })

      const inUse = Object.values(balances).filter((b: any) => b.totalDebit > 0 || b.totalCredit > 0)
      setReport(inUse as any[])
    }
    setLoading(false)
  }

  useEffect(() => { fetchBalance() }, [accounts])

  const totalDebit = report.reduce((s, r: any) => s + r.totalDebit, 0)
  const totalCredit = report.reduce((s, r: any) => s + r.totalCredit, 0)

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Balance générale</h3>
      <div className="flex gap-4 mb-4 items-end">
        <div>
          <label className="label-field">Du</label>
          <input type="date" className="input-field" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
        </div>
        <div>
          <label className="label-field">Au</label>
          <input type="date" className="input-field" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
        </div>
        <button onClick={fetchBalance} className="btn-primary">Filtrer</button>
      </div>
      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : report.length === 0 ? (
        <div className="empty-state"><p className="empty-state-text">Aucun mouvement pour cette période.</p></div>
      ) : (
        <div className="table-container border-0 rounded-none shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th>Compte</th>
                <th>Total Débit</th>
                <th>Total Crédit</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r: any) => {
                const balance = r.account.nature === 'DEBIT'
                  ? r.totalDebit - r.totalCredit
                  : r.totalCredit - r.totalDebit
                return (
                  <tr key={r.account.id}>
                    <td className="font-mono text-sm">{r.account.code} - {r.account.name}</td>
                    <td className="text-right">{formatCurrency(r.totalDebit)}</td>
                    <td className="text-right">{formatCurrency(r.totalCredit)}</td>
                    <td className={`text-right font-semibold ${balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(Math.abs(balance))} {balance < 0 ? '(Crédit)' : '(Débit)'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold bg-gray-50">
                <td>Totaux</td>
                <td className="text-right">{formatCurrency(totalDebit)}</td>
                <td className="text-right">{formatCurrency(totalCredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

function ProfitLossReport({ accounts }: { accounts: any[] }) {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams({ limit: '500' })
      const res = await fetch(`/api/comptabilite/entries?${params}`)
      if (res.ok) setEntries((await res.json()).entries)
      setLoading(false)
    }
    load()
  }, [])

  const chargesAccounts = accounts.filter((a: any) => a.type === 'CHARGE' && !accounts.some((p: any) => p.parentId === a.id))
  const produitsAccounts = accounts.filter((a: any) => a.type === 'PRODUIT' && !accounts.some((p: any) => p.parentId === a.id))

  const calcBalance = (accId: number) => {
    let debit = 0, credit = 0
    entries.forEach((e: any) => {
      e.lines.forEach((l: any) => {
        if (l.accountId === accId) { debit += l.debit; credit += l.credit }
        const childIds = accounts.filter((a: any) => {
          let p = a; while (p.parentId) { if (p.parentId === accId) return true; p = accounts.find((x: any) => x.id === p.parentId); if (!p) break }
          return false
        }).map((a: any) => a.id)
        if (childIds.includes(l.accountId)) { debit += l.debit; credit += l.credit }
      })
    })
    const acc = accounts.find((a: any) => a.id === accId)
    return acc?.nature === 'DEBIT' ? debit - credit : credit - debit
  }

  const chargesTotal = chargesAccounts.reduce((s, a) => s + Math.max(0, calcBalance(a.id)), 0)
  const produitsTotal = produitsAccounts.reduce((s, a) => s + Math.max(0, calcBalance(a.id)), 0)
  const resultat = produitsTotal - chargesTotal

  if (loading) return <div className="loader"><div className="loader-spinner" /></div>

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-base font-semibold text-red-700 mb-4">Charges</h3>
          <div className="space-y-2">
            {chargesAccounts.map((a: any) => {
              const bal = Math.max(0, calcBalance(a.id))
              if (bal === 0) return null
              return (
                <div key={a.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{a.code} - {a.name}</span>
                  <span className="font-medium">{formatCurrency(bal)}</span>
                </div>
              )
            })}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-red-700">
              <span>Total charges</span>
              <span>{formatCurrency(chargesTotal)}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-base font-semibold text-green-700 mb-4">Produits</h3>
          <div className="space-y-2">
            {produitsAccounts.map((a: any) => {
              const bal = Math.max(0, calcBalance(a.id))
              if (bal === 0) return null
              return (
                <div key={a.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{a.code} - {a.name}</span>
                  <span className="font-medium">{formatCurrency(bal)}</span>
                </div>
              )
            })}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-green-700">
              <span>Total produits</span>
              <span>{formatCurrency(produitsTotal)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`card border-2 ${resultat >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">{resultat >= 0 ? 'Bénéfice net' : 'Perte nette'}</h3>
            <p className="text-sm text-gray-500">{resultat >= 0 ? 'Produits - Charges' : 'Charges - Produits'}</p>
          </div>
          <span className={`text-2xl font-bold ${resultat >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {resultat >= 0 ? '+' : '-'}{formatCurrency(Math.abs(resultat))}
          </span>
        </div>
      </div>
    </div>
  )
}

function BalanceSheet({ accounts }: { accounts: any[] }) {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams({ limit: '500' })
      const res = await fetch(`/api/comptabilite/entries?${params}`)
      if (res.ok) setEntries((await res.json()).entries)
      setLoading(false)
    }
    load()
  }, [])

  const calcSolde = (accId: number) => {
    let debit = 0, credit = 0
    entries.forEach((e: any) => {
      e.lines.forEach((l: any) => {
        if (l.accountId === accId) { debit += l.debit; credit += l.credit }
      })
    })
    const acc = accounts.find((a: any) => a.id === accId)
    return acc?.nature === 'DEBIT' ? debit - credit : credit - debit
  }

  const getChildrenSum = (parentId: number): number => {
    const children = accounts.filter((a: any) => a.parentId === parentId)
    if (children.length === 0) return Math.max(0, calcSolde(parentId))
    return children.reduce((s, c) => s + getChildrenSum(c.id), 0)
  }

  const getActifRoots = () => accounts.filter((a: any) => a.type === 'ACTIF' && !a.parentId)
  const getPassifRoots = () => accounts.filter((a: any) => a.type === 'PASSIF' && !a.parentId)

  const getChildrenRows = (parentId: number): any[] => {
    const children = accounts.filter((a: any) => a.parentId === parentId)
    return children.map(c => {
      const subChildren = accounts.filter((a: any) => a.parentId === c.id)
      if (subChildren.length > 0) {
        return { account: c, amount: getChildrenSum(c.id), children: getChildrenRows(c.id) }
      }
      return { account: c, amount: Math.max(0, calcSolde(c.id)), children: [] }
    }).filter(r => r.amount > 0)
  }

  const actifRows = getActifRoots().map(a => ({ account: a, amount: getChildrenSum(a.id), children: getChildrenRows(a.id) })).filter(r => r.amount > 0)
  const passifRows = getPassifRoots().map(a => ({ account: a, amount: getChildrenSum(a.id), children: getChildrenRows(a.id) })).filter(r => r.amount > 0)

  const totalActif = actifRows.reduce((s, r) => s + r.amount, 0)
  const totalPassif = passifRows.reduce((s, r) => s + r.amount, 0)

  if (loading) return <div className="loader"><div className="loader-spinner" /></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-base font-semibold text-emerald-700 mb-4">Actif</h3>
        {actifRows.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun actif</p>
        ) : (
          <div className="space-y-1">
            {actifRows.map((r: any) => (
              <BalanceRow key={r.account.id} row={r} depth={0} />
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-emerald-700 mt-2">
              <span>Total Actif</span>
              <span>{formatCurrency(totalActif)}</span>
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <h3 className="text-base font-semibold text-blue-700 mb-4">Passif</h3>
        {passifRows.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun passif</p>
        ) : (
          <div className="space-y-1">
            {passifRows.map((r: any) => (
              <BalanceRow key={r.account.id} row={r} depth={0} />
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-blue-700 mt-2">
              <span>Total Passif</span>
              <span>{formatCurrency(totalPassif)}</span>
            </div>
          </div>
        )}
        <div className={`mt-4 p-3 rounded-lg text-sm ${Math.abs(totalActif - totalPassif) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {Math.abs(totalActif - totalPassif) < 0.01
            ? 'Bilan équilibré ✓'
            : `Écart de ${formatCurrency(Math.abs(totalActif - totalPassif))}`}
        </div>
      </div>
    </div>
  )
}

function BalanceRow({ row, depth }: { row: any; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  return (
    <>
      <div
        className="flex justify-between text-sm py-1 hover:bg-gray-50 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => setOpen(!open)}
      >
        <span className="text-gray-600">
          {row.children.length > 0 && (
            <svg className={`w-3 h-3 inline mr-1 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {row.account.code} - {row.account.name}
        </span>
        <span className="font-medium">{formatCurrency(row.amount)}</span>
      </div>
      {open && row.children.map((c: any) => (
        <BalanceRow key={c.account.id} row={c} depth={depth + 1} />
      ))}
    </>
  )
}
