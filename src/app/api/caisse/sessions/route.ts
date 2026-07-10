import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const where: any = {}
    if (user.role === 'CAISSIER') {
      where.userId = user.id
    }

    const sessions = await prisma.cashRegisterSession.findMany({
      where,
      include: {
        caisse: { include: { pointOfSale: true } },
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { sales: true, cashMovements: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['CAISSIER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const caisseId = parseInt(body.caisseId)
    const openingBalance = parseFloat(body.openingBalance) || 0

    if (!caisseId) {
      return NextResponse.json({ error: 'Caisse invalide' }, { status: 400 })
    }

    const existing = await prisma.cashRegisterSession.findFirst({
      where: { caisseId, status: 'OUVERTE' },
    })
    if (existing) {
      return NextResponse.json({ error: 'Une session est déjà ouverte pour cette caisse' }, { status: 409 })
    }

    const session = await prisma.cashRegisterSession.create({
      data: {
        caisseId,
        userId: user.id,
        openingBalance,
        status: 'OUVERTE',
      },
      include: { caisse: { include: { pointOfSale: true } } },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('POST /api/caisse/sessions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
