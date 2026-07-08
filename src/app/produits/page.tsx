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

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Produits</h1>
        {user?.role === 'ADMIN' && (
          <button onClick={() => { setEditing(null); setShowModal(true) }} className="btn-primary">+ Nouveau produit</button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lcg-500 mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">Produit</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Catégorie</th>
                  <th className="py-3 px-2">Unité</th>
                  <th className="py-3 px-2 text-right">Particulier</th>
                  <th className="py-3 px-2 text-right">Professionnel</th>
                  <th className="py-3 px-2 text-right">Grossiste</th>
                  <th className="py-3 px-2 text-right">Stock min</th>
                  <th className="py-3 px-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{p.name}</td>
                    <td className="py-3 px-2">{getProductTypeLabel(p.type)}</td>
                    <td className="py-3 px-2">{p.category?.name}</td>
                    <td className="py-3 px-2">{p.unit}</td>
                    <td className="py-3 px-2 text-right">{p.priceParticulier > 0 ? formatCurrency(p.priceParticulier) : '—'}</td>
                    <td className="py-3 px-2 text-right">{p.priceProfessionnel > 0 ? formatCurrency(p.priceProfessionnel) : '—'}</td>
                    <td className="py-3 px-2 text-right">{p.priceGrossiste > 0 ? formatCurrency(p.priceGrossiste) : '—'}</td>
                    <td className="py-3 px-2 text-right">{p.minStockLevel}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Nouveau produit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label-field">Nom du produit</label><input name="name" className="input-field" required /></div>
              <div><label className="label-field">Slug</label><input name="slug" className="input-field" required /></div>
              <div><label className="label-field">Type</label>
                <select name="type" className="input-field" required>
                  <option value="CUBES_STANDARDS">Cubes Standards</option>
                  <option value="GLAÇONS_CYLINDRIQUES">Glaçons Cylindriques</option>
                  <option value="GLAÇONS_SPHÉRIQUES">Glaçons Sphériques</option>
                  <option value="GLACE_PILÉE">Glace Pilée</option>
                  <option value="BLOCS_GLACE">Blocs de Glace</option>
                  <option value="CONDITIONNEMENT_PROFESSIONNEL">Conditionnement Professionnel</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div><label className="label-field">Catégorie</label>
                <select name="categoryId" className="input-field" required>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label-field">Unité de vente</label><input name="unit" className="input-field" defaultValue="sac" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field">Prix particulier</label><input name="priceParticulier" type="number" className="input-field" /></div>
                <div><label className="label-field">Prix professionnel</label><input name="priceProfessionnel" type="number" className="input-field" /></div>
                <div><label className="label-field">Prix grossiste</label><input name="priceGrossiste" type="number" className="input-field" /></div>
              </div>
              <div><label className="label-field">Stock minimum</label><input name="minStockLevel" type="number" className="input-field" defaultValue="10" /></div>
              <div><label className="label-field">Durée de conservation (heures)</label><input name="conservationDuration" type="number" className="input-field" defaultValue="48" /></div>
              <div><label className="label-field">Description</label><textarea name="description" className="input-field" rows={3}></textarea></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Créer le produit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
