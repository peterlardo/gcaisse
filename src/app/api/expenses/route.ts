import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateReference } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (startDate || endDate) {
      where.paidAt = {}
      if (startDate) where.paidAt.gte = new Date(startDate)
      if (endDate) where.paidAt.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where, orderBy: { paidAt: 'desc' }, skip, take: limit,
        include: { category: true, user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.expense.count({ where }),
    ])

    const totalAmount = await prisma.expense.aggregate({ where, _sum: { amount: true } })

    return NextResponse.json({ expenses, total, totalAmount: totalAmount._sum.amount || 0, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'DIRECTION'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const reference = generateReference('DEP')

    const expense = await prisma.expense.create({
      data: {
        reference,
        categoryId: parseInt(body.categoryId),
        description: body.description,
        amount: parseFloat(body.amount),
        paymentMethod: body.paymentMethod || 'ESPECES',
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        notes: body.notes || null,
        userId: user.id,
      },
      include: { category: true, user: { select: { id: true, firstName: true, lastName: true } } },
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
