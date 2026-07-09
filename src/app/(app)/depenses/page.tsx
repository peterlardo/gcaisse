'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { downloadExcel } from '@/lib/export'

export default function DepensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAmount, setTotalAmount] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)

  const [formCat, setFormCat] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formMethod, setFormMethod] = useState('ESPECES')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [showCatModal, setShowCatModal] = useState(false)
  const [newCat, setNewCat] = useState('')

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (categoryFilter) params.set('categoryId', categoryFilter)
      const res = await fetch(`/api/expenses?${params}`)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setTotalPages(data.totalPages || 1)
      setTotalAmount(data.totalAmount || 0)
    } catch { } finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/expenses/categories')
    if (res.ok) setCategories((await res.json()).categories || [])
  }

  useEffect(() => { fetchExpenses() }, [page, categoryFilter])
  useEffect(() => { fetchCategories() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCat || !formDesc || !formAmount) { toast.error('Champs obligatoires'); return }
    setSaving(true)
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: formCat, description: formDesc, amount: formAmount, paymentMethod: formMethod, paidAt: formDate, notes: formNotes }),
    })
    if (res.ok) {
      toast.success('Dépense enregistrée')
      setShowModal(false); setFormDesc(''); setFormAmount(''); setFormNotes('')
      fetchExpenses()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Erreur')
    }
    setSaving(false)
  }

  const handleAddCategory = async () => {
    if (!newCat.trim()) return
    const res = await fetch('/api/expenses/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCat.trim() }),
    })
    if (res.ok) { toast.success('Catégorie ajoutée'); setNewCat(''); setShowCatModal(false); fetchCategories() }
    else toast.error('Erreur')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette dépense ?')) return
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Dépense supprimée'); fetchExpenses() }
  }

  const canEdit = user && ['ADMIN', 'DIRECTION'].includes(user.role)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dépenses</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExcel('depenses')} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
          {canEdit && (<button onClick={() => setShowModal(true)} className="btn-primary"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Nouvelle dépense</button>)}
        </div>
      </div>

      {totalAmount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card"><p className="stat-label">Total des dépenses</p><p className="stat-value text-red-600">{totalAmount.toLocaleString('fr-FR')} FCFA</p></div>
          <div className="stat-card"><p className="stat-label">Nombre de dépenses</p><p className="stat-value">{expenses.length}</p></div>
          <div className="stat-card"><p className="stat-label">Moyenne</p><p className="stat-value">{(totalAmount / (expenses.length || 1)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</p></div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <select className="input-field max-w-xs" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}>
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowCatModal(true)} className="text-xs text-lcg-600 hover:underline">+ Gérer les catégories</button>
      </div>

      <div className="table-container">
        {loading ? <div className="loader py-12"><div className="loader-spinner" /></div>
        : expenses.length === 0 ? (
          <div className="empty-state py-12">
            <div className="empty-state-icon"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
            <p className="empty-state-title">Aucune dépense</p><p className="empty-state-text">Enregistrez vos premières dépenses.</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead><tr><th>Réf.</th><th>Date</th><th>Catégorie</th><th>Description</th><th>Montant</th><th>Paiement</th><th>Saisi par</th><th></th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="text-xs font-mono">{e.reference}</td>
                    <td className="text-xs whitespace-nowrap">{new Date(e.paidAt).toLocaleDateString('fr-FR')}</td>
                    <td><span className="badge-info">{e.category.name}</span></td>
                    <td className="text-xs max-w-sm"><p className="line-clamp-1">{e.description}</p></td>
                    <td className="font-semibold text-red-600">{e.amount.toLocaleString('fr-FR')}</td>
                    <td className="text-xs">{e.paymentMethod}</td>
                    <td className="text-xs text-gray-500">{e.user.firstName} {e.user.lastName}</td>
                    <td>{canEdit && <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}</td>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Nouvelle dépense</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select value={formCat} onChange={e => setFormCat(e.target.value)} className="input-field" required>
                  <option value="">Sélectionner...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="input-field" placeholder="Achat matière première..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                  <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="input-field" placeholder="50000" required min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                  <select value={formMethod} onChange={e => setFormMethod(e.target.value)} className="input-field">
                    <option value="ESPECES">Espèces</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CARTE">Carte</option>
                    <option value="VIREMENT">Virement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} className="input-field" placeholder="Facture #..." />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Nouvelle catégorie</h2>
            <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} className="input-field" placeholder="Transport, Électricité..." />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCatModal(false)} className="btn-secondary">Annuler</button>
              <button onClick={handleAddCategory} className="btn-primary">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
