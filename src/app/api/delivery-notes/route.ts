import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateReference } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const notes = await prisma.deliveryNote.findMany({
      include: {
        sourceDepot: true,
        destDepot: true,
        destPointOfSale: true,
        distribution: { select: { reference: true } },
        user: { select: { firstName: true, lastName: true } },
        receivedBy: { select: { firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ notes })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const reference = generateReference('BL')

    const note = await prisma.deliveryNote.create({
      data: {
        reference,
        distributionId: body.distributionId ? parseInt(body.distributionId) : null,
        sourceDepotId: parseInt(body.sourceDepotId),
        destDepotId: body.destDepotId ? parseInt(body.destDepotId) : null,
        destPointOfSaleId: body.destPointOfSaleId ? parseInt(body.destPointOfSaleId) : null,
        clientName: body.clientName || null,
        clientPhone: body.clientPhone || null,
        clientAddress: body.clientAddress || null,
        status: 'EN_PRÉPARATION',
        notes: body.notes || null,
        userId: user.id,
        items: {
          create: (body.items || []).map((item: any) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity) || 0,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        sourceDepot: true,
        destDepot: true,
        destPointOfSale: true,
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
