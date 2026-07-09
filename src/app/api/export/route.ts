import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { type, filters } = await request.json()

    let data: any[] = []
    let headers: string[] = []

    switch (type) {
      case 'ventes': {
        const sales = await prisma.sale.findMany({
          where: filters || {},
          include: { items: { include: { product: true } }, client: true, user: true, pointOfSale: true },
          orderBy: { createdAt: 'desc' },
        })
        headers = ['Référence', 'Date', 'Client', 'Point de vente', 'Articles', 'Sous-total', 'Remise', 'Total', 'Payé', 'Statut', 'Caissier']
        data = sales.map(s => [s.reference, new Date(s.createdAt).toLocaleDateString('fr-FR'), s.client?.name || '—', s.pointOfSale.name, s.items.map(i => `${i.quantity}x ${i.product.name}`).join(', '), s.subtotal, s.discount, s.total, s.paidAmount, s.status, `${s.user.firstName} ${s.user.lastName}`])
        break
      }
      case 'clients': {
        const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })
        headers = ['Nom', 'Type', 'Téléphone', 'Email', 'Ville', 'Crédit', 'Inscrit le']
        data = clients.map(c => [c.name, c.type, c.phone || '—', c.email || '—', c.city, c.creditBalance, new Date(c.createdAt).toLocaleDateString('fr-FR')])
        break
      }
      case 'stocks': {
        const stocks = await prisma.stockAtLocation.findMany({
          include: { product: true, pointOfSale: true, depot: true },
          orderBy: { product: { name: 'asc' } },
        })
        headers = ['Produit', 'Type', 'Unité', 'Lieu', 'Quantité']
        data = stocks.map(s => [s.product.name, s.product.type, s.product.unit, s.pointOfSale?.name || s.depot?.name || '—', s.quantity])
        break
      }
      case 'depenses': {
        const expenses = await prisma.expense.findMany({
          include: { category: true, user: true },
          orderBy: { paidAt: 'desc' },
        })
        headers = ['Référence', 'Catégorie', 'Description', 'Montant', 'Paiement', 'Date', 'Saisi par']
        data = expenses.map(e => [e.reference, e.category.name, e.description, e.amount, e.paymentMethod, new Date(e.paidAt).toLocaleDateString('fr-FR'), `${e.user.firstName} ${e.user.lastName}`])
        break
      }
      default:
        return NextResponse.json({ error: 'Type d\'export invalide' }, { status: 400 })
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    ws['!cols'] = headers.map(() => ({ wch: 20 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, type)
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}-${Date.now()}.xlsx"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
