import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true } },
        pointOfSale: true,
        items: { include: { product: true } },
      },
    })

    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  EN_ATTENTE: ['CONFIRMÉE', 'ANNULÉE'],
  CONFIRMÉE: ['EN_PRÉPARATION', 'ANNULÉE'],
  EN_PRÉPARATION: ['LIVRÉE', 'ANNULÉE'],
  LIVRÉE: [],
  RETIRÉE: [],
  ANNULÉE: [],
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const orderId = parseInt(params.id)
    const { action } = body

    if (!action) return NextResponse.json({ error: 'Action requise' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    const validNext = VALID_TRANSITIONS[order.status]
    if (!validNext || !validNext.includes(action)) {
      return NextResponse.json({
        error: `Transition invalide: ${order.status} → ${action}`,
      }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: action },
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
    })

    return NextResponse.json({ order: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
