'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, getProductTypeLabel } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function ProduitsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => { fetchProducts(); fetchCategories() }, [])

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data.categories || [])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data: any = Object.fromEntries(form)

    if (editing) {
      const res = await fetch(`/api/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success('Produit modifié')
        setShowModal(false)
        setEditing(null)
        fetchProducts()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur')
      }
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success('Produit créé')
        setShowModal(false)
        fetchProducts()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur')
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Produits</h1>
        {user?.role === 'ADMIN' && (
          <button onClick={() => { setEditing(null); setShowModal(true) }} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau produit
          </button>
        )}
      </div>

      {loading ? (
        <div className="card">
          <div className="loader">
            <div className="loader-spinner" />
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="empty-state-title">Aucun produit</p>
            <p className="empty-state-text">Commencez par créer un nouveau produit.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Unité</th>
                <th className="text-right">Particulier</th>
                <th className="text-right">Professionnel</th>
                <th className="text-right">Grossiste</th>
                <th className="text-right">Stock min</th>
                <th>Statut</th>
                <th className="text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td>{getProductTypeLabel(p.type)}</td>
                  <td>{p.category?.name}</td>
                  <td>{p.unit}</td>
                  <td className="text-right">{p.priceParticulier > 0 ? formatCurrency(p.priceParticulier) : '—'}</td>
                  <td className="text-right">{p.priceProfessionnel > 0 ? formatCurrency(p.priceProfessionnel) : '—'}</td>
                  <td className="text-right">{p.priceGrossiste > 0 ? formatCurrency(p.priceGrossiste) : '—'}</td>
                  <td className="text-right">{p.minStockLevel}</td>
                  <td>
                    <span className={p.isActive ? 'badge-success' : 'badge-danger'}>
                      {p.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => { setEditing(p); setShowModal(true) }}
                      className="btn-ghost btn-sm p-1.5 text-gray-400 hover:text-lcg-600"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-xl">
            <div className="modal-header">
              <h2 className="text-lg font-bold">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button type="button" onClick={() => { setShowModal(false); setEditing(null) }} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label-field">Nom du produit</label>
                  <input name="name" className="input-field" required defaultValue={editing?.name || ''} />
                </div>
                {!editing && (
                  <div>
                    <label className="label-field">Slug</label>
                    <input name="slug" className="input-field" required />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Type</label>
                    <select name="type" className="input-field" required defaultValue={editing?.type || ''}>
                      <option value="CUBES_STANDARDS">Cubes Standards</option>
                      <option value="GLAÇONS_CYLINDRIQUES">Glaçons Cylindriques</option>
                      <option value="GLAÇONS_SPHÉRIQUES">Glaçons Sphériques</option>
                      <option value="GLACE_PILÉE">Glace Pilée</option>
                      <option value="BLOCS_GLACE">Blocs de Glace</option>
                      <option value="CONDITIONNEMENT_PROFESSIONNEL">Conditionnement Professionnel</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Catégorie</label>
                    <select name="categoryId" className="input-field" required defaultValue={editing?.categoryId || ''}>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-field">Unité de vente</label>
                  <input name="unit" className="input-field" defaultValue={editing?.unit || 'sac'} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label-field">Prix particulier (FCFA)</label>
                    <input name="priceParticulier" type="number" className="input-field" defaultValue={editing?.priceParticulier || ''} />
                  </div>
                  <div>
                    <label className="label-field">Prix professionnel (FCFA)</label>
                    <input name="priceProfessionnel" type="number" className="input-field" defaultValue={editing?.priceProfessionnel || ''} />
                  </div>
                  <div>
                    <label className="label-field">Prix grossiste (FCFA)</label>
                    <input name="priceGrossiste" type="number" className="input-field" defaultValue={editing?.priceGrossiste || ''} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Stock minimum</label>
                    <input name="minStockLevel" type="number" className="input-field" defaultValue={editing?.minStockLevel || 10} />
                  </div>
                  <div>
                    <label className="label-field">Conservation (heures)</label>
                    <input name="conservationDuration" type="number" className="input-field" defaultValue={editing?.conservationDuration || 48} />
                  </div>
                </div>
                <div>
                  <label className="label-field">Description</label>
                  <textarea name="description" className="input-field" rows={3} defaultValue={editing?.description || ''}></textarea>
                </div>
                {editing && (
                  <div className="flex items-center gap-3">
                    <label className="label-field mb-0">Produit actif</label>
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
                  {editing ? 'Enregistrer les modifications' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
