import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTodayRange, getMonthRange, getDateRange } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'DIRECTION'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    let range = getMonthRange()
    if (period === 'today') range = getTodayRange()
    if (period === 'week') range = getDateRange(7)
    if (period === 'year') {
      const now = new Date()
      range = { start: new Date(now.getFullYear(), 0, 1), end: now }
    }

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: range.start, lte: range.end } },
      include: { items: { include: { product: true } }, payments: true },
    })

    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
    const totalSales = sales.length

    const salesByProduct = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { createdAt: { gte: range.start, lte: range.end } } },
      _sum: { quantity: true, total: true },
    })

    const productIds = salesByProduct.map(s => s.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap = new Map(products.map(p => [p.id, p.name]))

    const productStats = salesByProduct.map(s => ({
      productId: s.productId,
      name: productMap.get(s.productId) || 'Inconnu',
      quantity: s._sum.quantity || 0,
      total: s._sum.total || 0,
    })).sort((a, b) => b.total - a.total)

    const salesByClient = await prisma.sale.groupBy({
      by: ['clientId'],
      where: { clientId: { not: null }, createdAt: { gte: range.start, lte: range.end } },
      _sum: { total: true },
      _count: true,
    })

    const clientIds = salesByClient.map(s => s.clientId).filter(Boolean) as number[]
    const clients = await prisma.client.findMany({ where: { id: { in: clientIds } } })
    const clientMap = new Map(clients.map(c => [c.id, c.name]))

    const clientStats = salesByClient.map(s => ({
      name: clientMap.get(s.clientId!) || 'Inconnu',
      total: s._sum.total || 0,
      count: s._count,
    })).sort((a, b) => b.total - a.total)

    const salesByPointOfSale = await prisma.sale.groupBy({
      by: ['pointOfSaleId'],
      where: { createdAt: { gte: range.start, lte: range.end } },
      _sum: { total: true },
      _count: true,
    })

    const pvIds = salesByPointOfSale.map(s => s.pointOfSaleId)
    const pvs = await prisma.pointOfSale.findMany({ where: { id: { in: pvIds } } })
    const pvMap = new Map(pvs.map(p => [p.id, p.name]))

    const pvStats = salesByPointOfSale.map(s => ({
      name: pvMap.get(s.pointOfSaleId) || 'Inconnu',
      total: s._sum.total || 0,
      count: s._count,
    }))

    const salesByUser = await prisma.sale.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: range.start, lte: range.end } },
      _sum: { total: true },
      _count: true,
    })

    const userIds = salesByUser.map(s => s.userId)
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } })
    const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]))

    const userStats = salesByUser.map(s => ({
      name: userMap.get(s.userId) || 'Inconnu',
      total: s._sum.total || 0,
      count: s._count,
    })).sort((a, b) => b.total - a.total)

    const monthlySales = await prisma.sale.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1), lte: new Date() } },
      _sum: { total: true },
    })

    const monthlyMap = new Map<string, number>()
    monthlySales.forEach(s => {
      const month = new Date(s.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (s._sum.total || 0))
    })

    const seasonality = Array.from(monthlyMap.entries()).map(([month, total]) => ({ month, total }))

    return NextResponse.json({
      totalRevenue,
      totalSales,
      productStats,
      clientStats,
      pvStats,
      userStats,
      seasonality,
      topProducts: productStats.slice(0, 10),
      lowProducts: productStats.slice(-5).reverse(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
