import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTodayRange, getDateRange, getMonthRange } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const today = getTodayRange()
    const week = getDateRange(7)
    const month = getMonthRange()

    const pointOfSaleFilter = user.role === 'CAISSIER' && user.pointOfSaleId
      ? { pointOfSaleId: user.pointOfSaleId } : {}

    const todaySales = await prisma.sale.findMany({
      where: { createdAt: { gte: today.start, lte: today.end }, ...pointOfSaleFilter },
      include: { items: true },
    })

    const weekSales = await prisma.sale.findMany({
      where: { createdAt: { gte: week.start, lte: week.end }, ...pointOfSaleFilter },
    })

    const monthSales = await prisma.sale.findMany({
      where: { createdAt: { gte: month.start, lte: month.end }, ...pointOfSaleFilter },
    })

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
    const weekRevenue = weekSales.reduce((sum, s) => sum + s.total, 0)
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0)

    const todayPayments = await prisma.payment.findMany({
      where: { receivedAt: { gte: today.start, lte: today.end } },
    })
    const todayCash = todayPayments.reduce((sum, p) => sum + p.amount, 0)

    const lowStockProducts = await prisma.stockAtLocation.findMany({
      where: { pointOfSaleId: user.pointOfSaleId || undefined },
      include: { product: true },
    })

    const stockAlerts = lowStockProducts.filter(s => s.quantity <= s.product.minStockLevel).length

    const pendingOrders = await prisma.order.count({
      where: { status: 'EN_ATTENTE' },
    })

    const todayProductions = await prisma.productionBatch.findMany({
      where: { productionDate: { gte: today.start, lte: today.end } },
    })
    const todayProduction = todayProductions.reduce((sum, p) => sum + p.quantityProduced, 0)

    const salesByProduct = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { createdAt: { gte: month.start, lte: month.end } } },
      _sum: { quantity: true },
    })

    const productIds = salesByProduct.map(s => s.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map(p => [p.id, p.name]))
    const salesByProductData = salesByProduct
      .map(s => ({ name: productMap.get(s.productId) || 'Inconnu', total: s._sum.quantity || 0 }))
      .sort((a, b) => b.total - a.total)

    const hours = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}h`)
    const salesByHour = hours.map(hour => {
      const h = parseInt(hour)
      const salesInHour = todaySales.filter(s => {
        const saleHour = new Date(s.createdAt).getHours()
        return saleHour === h
      })
      return { hour, total: salesInHour.reduce((sum, s) => sum + s.total, 0) }
    })

    return NextResponse.json({
      todayRevenue,
      weekRevenue,
      monthRevenue,
      todaySales: todaySales.length,
      todayCash,
      stockAlerts,
      pendingOrders,
      todayProduction,
      salesByProduct: salesByProductData.slice(0, 10),
      salesByHour,
      topProducts: salesByProductData.slice(0, 10),
      lowStockProducts: lowStockProducts
        .filter(s => s.quantity <= s.product.minStockLevel)
        .map(s => ({ name: s.product.name, quantity: s.quantity, minLevel: s.product.minStockLevel })),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
