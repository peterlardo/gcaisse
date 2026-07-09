import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const created: string[] = []

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        stockAtLocation: { select: { quantity: true, depot: { select: { name: true } }, pointOfSale: { select: { name: true } } } },
      },
    })

    for (const product of products) {
      const totalStock = product.stockAtLocation.reduce((s, sl) => s + sl.quantity, 0)
      if (totalStock <= product.minStockLevel) {
        const locations = product.stockAtLocation
          .filter(sl => sl.quantity > 0)
          .map(sl => `${sl.depot?.name || sl.pointOfSale?.name || '?'} (${sl.quantity})`)
          .join(', ')

        const msg = `Stock bas: ${product.name} (${totalStock}/${product.minStockLevel})${locations ? ` — ${locations}` : ''}`

        const existing = await prisma.alert.findFirst({
          where: { message: msg, isRead: false },
        })
        if (!existing) {
          await prisma.alert.create({
            data: { type: 'STOCK_BAS', message: msg, severity: totalStock === 0 ? 'CRITICAL' : 'WARNING', link: '/stocks' },
          })
          created.push(msg)
        }
      }
    }

    const expiringSubs = await prisma.clientSubscription.findMany({
      where: {
        status: 'ACTIF',
        endDate: { not: null, lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { client: { select: { name: true } }, product: { select: { name: true } } },
      take: 50,
    })

    for (const sub of expiringSubs) {
      const msg = `Abonnement expire bientôt: ${sub.client.name} - ${sub.product.name} (fin: ${sub.endDate?.toLocaleDateString('fr-FR')})`
      const existing = await prisma.alert.findFirst({ where: { message: msg, isRead: false } })
      if (!existing) {
        await prisma.alert.create({
          data: { type: 'ABONNEMENT', message: msg, severity: 'WARNING', link: '/clients' },
        })
        created.push(msg)
      }
    }

    return NextResponse.json({ created: created.length, alerts: created })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
