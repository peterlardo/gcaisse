import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateReference } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const where: any = {}
    if (user.role === 'CAISSIER' && user.pointOfSaleId) {
      where.pointOfSaleId = user.pointOfSaleId
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true } },
        pointOfSale: true,
        items: { include: { product: true } },
      },
      orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    })

    return NextResponse.json({ reservations })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const reference = generateReference('RES')

    const reservation = await prisma.reservation.create({
      data: {
        reference,
        clientId: body.clientId,
        pointOfSaleId: body.pointOfSaleId || user.pointOfSaleId || 1,
        status: 'EN_ATTENTE',
        scheduledDate: new Date(body.scheduledDate),
        scheduledTime: body.scheduledTime || null,
        notes: body.notes || null,
        userId: user.id,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { client: true, items: { include: { product: true } } },
    })

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
