import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTodayRange, getMonthRange, getDateRange } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'sales'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const pointOfSaleId = searchParams.get('pointOfSaleId')
    const format = searchParams.get('format') || 'json'

    let dateRange = getMonthRange()
    if (dateFrom) dateRange.start = new Date(dateFrom)
    if (dateTo) dateRange.end = new Date(dateTo + 'T23:59:59.999Z')

    let data: any = {}

    switch (type) {
      case 'sales': {
        const sales = await prisma.sale.findMany({
          where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
          include: { items: { include: { product: true } }, user: true, pointOfSale: true },
          orderBy: { createdAt: 'desc' },
        })
        data = { sales, total: sales.reduce((s, v) => s + v.total, 0), count: sales.length }
        break
      }
      case 'cash': {
        const sessions = await prisma.cashRegisterSession.findMany({
          where: { openedAt: { gte: dateRange.start, lte: dateRange.end } },
          include: { caisse: true, user: true, cashMovements: true },
          orderBy: { openedAt: 'desc' },
        })
        data = { sessions }
        break
      }
      case 'stock': {
        const stock = await prisma.stockAtLocation.findMany({
          include: { product: true, pointOfSale: true, depot: true },
        })
        const movements = await prisma.stockMovement.findMany({
          where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
          include: { product: true, user: true },
          orderBy: { createdAt: 'desc' },
        })
        data = { stock, movements }
        break
      }
      case 'production': {
        const batches = await prisma.productionBatch.findMany({
          where: { productionDate: { gte: dateRange.start, lte: dateRange.end } },
          include: { product: true, user: true, destinationDepot: true },
          orderBy: { productionDate: 'desc' },
        })
        data = { batches, totalProduced: batches.reduce((s, b) => s + b.quantityProduced, 0) }
        break
      }
      case 'distribution': {
        const distributions = await prisma.distribution.findMany({
          where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
          include: { items: { include: { product: true } }, sourceDepot: true, user: true },
          orderBy: { createdAt: 'desc' },
        })
        data = { distributions }
        break
      }
      case 'clients': {
        const clients = await prisma.client.findMany({
          include: { _count: { select: { sales: true, orders: true } } },
          orderBy: { createdAt: 'desc' },
        })
        data = { clients }
        break
      }
      case 'performance': {
        const sales = await prisma.sale.findMany({
          where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
          include: { items: true, user: true, pointOfSale: true },
        })
        const byUser = await prisma.sale.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
          _sum: { total: true },
          _count: true,
        })
        data = { sales, byUser, totalRevenue: sales.reduce((s, v) => s + v.total, 0) }
        break
      }
    }

    if (format === 'json') {
      return NextResponse.json({ report: data, type, dateRange })
    }

    return NextResponse.json({ report: data, type, dateRange })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
