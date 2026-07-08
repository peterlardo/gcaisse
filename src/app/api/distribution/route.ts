import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateReference } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const distributions = await prisma.distribution.findMany({
      include: {
        batch: { include: { product: true } },
        sourceDepot: true,
        user: { select: { firstName: true, lastName: true } },
        validatedBy: { select: { firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ distributions })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_STOCK'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const reference = generateReference('DIST')

    const distribution = await prisma.distribution.create({
      data: {
        reference,
        batchId: body.batchId || null,
        sourceDepotId: body.sourceDepotId,
        status: 'EN_PRÉPARATION',
        notes: body.notes || null,
        userId: user.id,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            quantitySent: item.quantity,
          })),
        },
      },
      include: { items: { include: { product: true } }, sourceDepot: true },
    })

    return NextResponse.json({ distribution }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
