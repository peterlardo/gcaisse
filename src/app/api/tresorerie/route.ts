import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month'

    const now = new Date()
    let start: Date
    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const dateFilter = { gte: start, lte: now }

    const sales = await prisma.sale.findMany({
      where: { createdAt: dateFilter },
      include: { payments: true, pointOfSale: true, items: true },
      orderBy: { createdAt: 'desc' },
    })

    const expenses = await prisma.expense.findMany({
      where: { paidAt: dateFilter },
      include: { category: true },
      orderBy: { paidAt: 'desc' },
    })

    const totalSales = sales.reduce((s, sale) => s + sale.total, 0)
    const totalExpenses = expenses.reduce((s, exp) => s + exp.amount, 0)

    const paymentMethods = await prisma.payment.groupBy({
      by: ['method'],
      where: { receivedAt: dateFilter },
      _sum: { amount: true },
    })

    return NextResponse.json({
      totalSales,
      totalExpenses,
      balance: totalSales - totalExpenses,
      salesCount: sales.length,
      expenseCount: expenses.length,
      paymentMethods: paymentMethods.map(pm => ({ method: pm.method, total: pm._sum.amount || 0 })),
      recentSales: sales.slice(0, 10).map(s => ({ id: s.id, reference: s.reference, total: s.total, createdAt: s.createdAt })),
      recentExpenses: expenses.slice(0, 10).map(e => ({ id: e.id, description: e.description, amount: e.amount, category: e.category })),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
