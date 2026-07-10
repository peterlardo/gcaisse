'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatDateTime, formatCurrency, getDeliveryNoteStatusLabel, getStatusColor } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { generateDeliveryNotePDF } from '@/lib/invoice'
import toast from 'react-hot-toast'

const STATUS_ACTIONS: Record<string, { label: string; action: string; color: string; roles: string[] }[]> = {
  EN_PRÉPARATION: [
    { label: 'Mettre en transit', action: 'EN_TRANSIT', color: 'btn-primary', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
    { label: 'Annuler', action: 'ANNULÉ', color: 'btn-danger', roles: ['ADMIN'] },
  ],
  EN_TRANSIT: [
    { label: 'Marquer livré', action: 'LIVRÉ', color: 'btn-success', roles: ['ADMIN', 'DIRECTION', 'RESPONSABLE_STOCK'] },
    { label: 'Annuler', action: 'ANNULÉ', color: 'btn-danger', roles: ['ADMIN'] },
  ],
  LIVRÉ: [],
  ANNULÉ: [],
}

export default function LivraisonsPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [depots, setDepots] = useState<any[]>([])
  const [points, setPoints] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [detailNote, setDetailNote] = useState<any>(null)
  const [receiveModal, setReceiveModal] = useState<any>(null)
  const [lastCreated, setLastCreated] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [nRes, dRes, pRes, prRes] = await Promise.all([
        fetch('/api/delivery-notes'),
        fetch('/api/depots'),
        fetch('/api/pointofsale'),
        fetch('/api/products?active=true'),
      ])
      setNotes((await nRes.json()).notes || [])
      setDepots((await dRes.json()).depots || [])
      setPoints((await pRes.json()).pointsOfSale || [])
      setProducts((await prRes.json()).products || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const productIds = form.getAll('productId[]')
    const quantities = form.getAll('quantity[]')

    const items = productIds.map((pid, i) => ({
      productId: pid as string,
      quantity: quantities[i] as string,
    })).filter(item => parseInt(item.quantity) > 0)

    if (items.length === 0) { toast.error('Ajoutez au moins un produit'); return }

    const res = await fetch('/api/delivery-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDepotId: form.get('sourceDepotId'),
        destDepotId: form.get('destDepotId') || null,
        clientName: form.get('clientName'),
        clientPhone: form.get('clientPhone'),
        clientAddress: form.get('clientAddress'),
        notes: form.get('notes'),
        items,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success('Bon de livraison créé')
      setShowModal(false)
      setLastCreated(data.note)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const handleAction = async (id: number, action: string) => {
    const confirmMsg = {
      EN_TRANSIT: 'Passer ce bon en transit ?',
      LIVRÉ: 'Marquer ce bon comme livré ?',
      ANNULÉ: 'Annuler ce bon ?',
    }[action]
    if (confirmMsg && !confirm(confirmMsg)) return

    const res = await fetch(`/api/delivery-notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    if (res.ok) {
      toast.success(`Bon ${getDeliveryNoteStatusLabel(action)}`)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const handleReceive = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const items: any[] = []
    const productIds = form.getAll('productId[]')

    for (const raw of productIds) {
      const pid = parseInt(raw as string)
      const qty = parseInt(form.get(`qty_${pid}`) as string)
      const received = parseInt(form.get(`received_${pid}`) as string)
      items.push({ productId: pid, quantity: qty, quantityReceived: isNaN(received) ? qty : received })
    }

    const res = await fetch(`/api/delivery-notes/${receiveModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LIVRÉ', destDepotId: receiveModal.destDepotId, items }),
    })

    if (res.ok) {
      toast.success('Bon réceptionné')
      setReceiveModal(null)
      fetchData()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erreur')
    }
  }

  const handleDownloadPDF = (note: any) => {
    const destination = note.destDepot?.name || note.destPointOfSale?.name || 'Client direct'
    generateDeliveryNotePDF({
      reference: note.reference,
      date: new Date(note.createdAt),
      sourceDepot: note.sourceDepot?.name || '—',
      destinationName: destination,
      clientName: note.clientName,
      clientPhone: note.clientPhone,
      clientAddress: note.clientAddress,
      notes: note.notes,
      items: note.items.map((i: any) => ({
        name: i.product?.name || 'Produit',
        quantity: i.quantity,
        quantityReceived: i.quantityReceived,
        difference: i.difference,
      })),
      status: note.status,
      createdBy: `${note.user?.firstName || ''} ${note.user?.lastName || ''}`.trim(),
      receivedBy: note.receivedBy ? `${note.receivedBy.firstName} ${note.receivedBy.lastName}` : undefined,
      receivedAt: note.receivedAt ? new Date(note.receivedAt) : undefined,
    })
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'DIRECTION' || user?.role === 'RESPONSABLE_STOCK'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bons de livraison</h1>
          <p className="text-sm text-gray-400 mt-1">{notes.length} bon(s)</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau bon
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">En préparation</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{notes.filter(n => n.status === 'EN_PRÉPARATION').length}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">En transit</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{notes.filter(n => n.status === 'EN_TRANSIT').length}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Livrés</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{notes.filter(n => n.status === 'LIVRÉ').length}</p>
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Annulés</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{notes.filter(n => n.status === 'ANNULÉ').length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card"><div className="loader"><div className="loader-spinner" /></div></div>
      ) : (
        <>
        {lastCreated && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between animate-fade-in">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Bon créé : {lastCreated.reference}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Téléchargez le bon de livraison pour l'imprimer</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { handleDownloadPDF(lastCreated); setLastCreated(null) }}
                className="btn-primary btn-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger le PDF
              </button>
              <button onClick={() => setLastCreated(null)} className="btn-ghost btn-sm">Fermer</button>
            </div>
          </div>
        )}
        </>)
      }

      {notes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="empty-state-title">Aucun bon de livraison</p>
            <p className="empty-state-text">Créez un bon pour tracker vos livraisons.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Réf</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Client</th>
                <th>Produits</th>
                <th>Statut</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n: any) => (
                <tr key={n.id} className="cursor-pointer" onClick={() => setDetailNote(n)}>
                  <td className="font-mono text-xs">{n.reference}</td>
                  <td className="text-sm">{n.sourceDepot?.name}</td>
                  <td className="text-sm">{n.destDepot?.name || n.destPointOfSale?.name || '—'}</td>
                  <td className="text-sm">{n.clientName || '—'}</td>
                  <td className="text-xs">{n.items?.map((i: any) => `${i.product?.name} x${i.quantity}`).join(', ')}</td>
                  <td>
                    <span className={`badge ${getStatusColor(n.status)}`}>{getDeliveryNoteStatusLabel(n.status)}</span>
                  </td>
                  <td className="text-xs">{formatDate(n.createdAt)}</td>
                  <td className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {n.status === 'EN_TRANSIT' && canEdit && (
                        <button
                          onClick={() => setReceiveModal(n)}
                          className="btn-success btn-sm text-xs"
                        >
                          Réceptionner
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPDF(n)}
                        className="btn-primary btn-sm text-xs"
                        title="Télécharger le PDF"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </button>
                      {(STATUS_ACTIONS[n.status] || []).map(a =>
                        a.roles.includes(user?.role || '') && a.action !== 'LIVRÉ' && (
                          <button
                            key={a.action}
                            onClick={() => handleAction(n.id, a.action)}
                            className={`${a.color} btn-sm text-xs`}
                          >
                            {a.label}
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Nouveau bon de livraison</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost btn-sm p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label-field">Dépôt source</label>
                  <select name="sourceDepotId" className="input-field" required>
                    <option value="">Sélectionner</option>
                    {depots.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Destination (dépôt)</label>
                  <select name="destDepotId" className="input-field">
                    <option value="">—</option>
                    {depots.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <hr className="border-gray-200" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ou livraison directe client</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Nom client</label>
                    <input name="clientName" className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Téléphone</label>
                    <input name="clientPhone" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label-field">Adresse client</label>
                  <input name="clientAddress" className="input-field" />
                </div>
                <hr className="border-gray-200" />
                <h4 className="font-semibold text-sm">Produits</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {products.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm">{p.name}</span>
                      <input type="hidden" name="productId[]" value={p.id} />
                      <input name="quantity[]" type="number" className="input-field w-20 text-center" placeholder="0" min="0" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="label-field">Notes</label>
                  <textarea name="notes" className="input-field" rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Créer le bon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailNote && (
        <div className="modal-overlay" onClick={() => setDetailNote(null)}>
          <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold">{detailNote.reference}</h2>
                <span className={`badge ${getStatusColor(detailNote.status)}`}>{getDeliveryNoteStatusLabel(detailNote.status)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleDownloadPDF(detailNote)} className="btn-primary btn-sm text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Télécharger
                </button>
                <button type="button" onClick={() => setDetailNote(null)} className="btn-ghost btn-sm p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="modal-body space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">Source</p><p className="font-medium">{detailNote.sourceDepot?.name}</p></div>
                <div><p className="text-xs text-gray-400">Destination</p><p className="font-medium">{detailNote.destDepot?.name || detailNote.destPointOfSale?.name || '—'}</p></div>
                {detailNote.clientName && <div className="col-span-2"><p className="text-xs text-gray-400">Client</p><p className="font-medium">{detailNote.clientName} {detailNote.clientPhone && `(${detailNote.clientPhone})`}</p></div>}
                {detailNote.distribution && <div><p className="text-xs text-gray-400">Distribution liée</p><p className="font-medium">{detailNote.distribution.reference}</p></div>}
                <div><p className="text-xs text-gray-400">Créé par</p><p className="font-medium">{detailNote.user?.firstName} {detailNote.user?.lastName}</p></div>
                <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{formatDateTime(detailNote.createdAt)}</p></div>
                {detailNote.receivedBy && <div className="col-span-2"><p className="text-xs text-gray-400">Réceptionné par</p><p className="font-medium">{detailNote.receivedBy.firstName} {detailNote.receivedBy.lastName} le {formatDateTime(detailNote.receivedAt)}</p></div>}
              </div>
              {detailNote.notes && <div><p className="text-xs text-gray-400">Notes</p><p>{detailNote.notes}</p></div>}
              <hr />
              <h4 className="font-semibold">Produits</h4>
              <table className="table">
                <thead><tr><th>Produit</th><th className="text-center">Qté</th><th className="text-center">Reçu</th><th className="text-center">Diff.</th></tr></thead>
                <tbody>
                  {detailNote.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="text-sm">{item.product?.name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">{item.quantityReceived ?? '—'}</td>
                      <td className="text-center">{item.difference !== 0 ? (item.difference > 0 ? `+${item.difference}` : item.difference) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {receiveModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="modal-header">
              <h2 className="text-lg font-bold">Réceptionner le bon</h2>
              <p className="text-xs text-gray-400">{receiveModal.reference}</p>
            </div>
            <form onSubmit={handleReceive}>
              <div className="modal-body space-y-3">
                <div>
                  <label className="label-field">Destination (dépôt)</label>
                  <select name="destDepotId" className="input-field" defaultValue={receiveModal.destDepotId || ''}>
                    <option value="">Sélectionner</option>
                    {depots.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <hr />
                <h4 className="font-semibold text-sm">Quantités reçues</h4>
                {receiveModal.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <input type="hidden" name="productId[]" value={item.productId} />
                    <input type="hidden" name={`qty_${item.productId}`} value={item.quantity} />
                    <span className="flex-1 text-sm">{item.product?.name}</span>
                    <span className="text-xs text-gray-400">Envoyé: {item.quantity}</span>
                    <input
                      name={`received_${item.productId}`}
                      type="number"
                      className="input-field w-20 text-center"
                      defaultValue={item.quantity}
                      min="0"
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setReceiveModal(null)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-success">Confirmer la réception</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
