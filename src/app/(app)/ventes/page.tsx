'use client'

import Link from 'next/link'

export default function VentesPage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Ventes</h1>
        <Link href="/ventes/nouvelle" className="btn-primary">
          + Nouvelle vente
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/ventes/nouvelle" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-4xl mb-4">💵</div>
          <h2 className="text-xl font-semibold">Nouvelle vente</h2>
          <p className="text-gray-500 mt-2">Enregistrer une vente rapide</p>
        </Link>
        <Link href="/ventes/historique" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-semibold">Historique des ventes</h2>
          <p className="text-gray-500 mt-2">Consulter et filtrer les ventes</p>
        </Link>
      </div>
    </div>
  )
}
