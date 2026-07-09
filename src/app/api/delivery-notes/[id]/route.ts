import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const VALID_TRANSITIONS: Record<string, string[]> = {
  EN_PRÉPARATION: ['EN_TRANSIT', 'ANNULÉ'],
  EN_TRANSIT: ['LIVRÉ', 'ANNULÉ'],
  LIVRÉ: [],
  ANNULÉ: [],
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const note = await prisma.deliveryNote.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        sourceDepot: true,
        destDepot: true,
        destPointOfSale: true,
        distribution: { select: { reference: true } },
        user: { select: { firstName: true, lastName: true } },
        receivedBy: { select: { firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
    })

    if (!note) return NextResponse.json({ error: 'Bon introuvable' }, { status: 404 })
    return NextResponse.json({ note })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const noteId = parseInt(params.id)
    const { action } = body

    if (!action) return NextResponse.json({ error: 'Action requise' }, { status: 400 })

    const note = await prisma.deliveryNote.findUnique({
      where: { id: noteId },
      include: { items: true },
    })
    if (!note) return NextResponse.json({ error: 'Bon introuvable' }, { status: 404 })

    const validNext = VALID_TRANSITIONS[note.status]
    if (!validNext || !validNext.includes(action)) {
      return NextResponse.json({ error: `Transition invalide: ${note.status} → ${action}` }, { status: 400 })
    }

    if (action === 'LIVRÉ') {
      const updated = await prisma.$transaction(async (tx) => {
        const dn = await tx.deliveryNote.update({
          where: { id: noteId },
          data: {
            status: 'LIVRÉ',
            receivedById: user.id,
            receivedAt: new Date(),
          },
          include: { items: true },
        })

        for (const item of dn.items) {
          const received = body.items?.find((i: any) => i.productId === item.productId)
          const qtyReceived = received?.quantityReceived ?? item.quantity
          const diff = qtyReceived - item.quantity

          await tx.deliveryNoteItem.update({
            where: { id: item.id },
            data: { quantityReceived: qtyReceived, difference: diff },
          })

          const destDepotId = body.destDepotId || dn.destDepotId
          if (destDepotId) {
            const stock = await tx.stockAtLocation.findFirst({
              where: { productId: item.productId, depotId: destDepotId, pointOfSaleId: null },
            })
            if (stock) {
              await tx.stockAtLocation.update({
                where: { id: stock.id },
                data: { quantity: { increment: qtyReceived } },
              })
            }

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'ENTRÉE',
                quantity: qtyReceived,
                depotId: destDepotId,
                userId: user.id,
                reason: 'Réception bon de livraison',
                reference: dn.reference,
              },
            })
          }
        }

        return dn
      })

      return NextResponse.json({ note: updated })
    }

    const updated = await prisma.deliveryNote.update({
      where: { id: noteId },
      data: { status: action },
      include: { items: { include: { product: true } }, sourceDepot: true },
    })

    return NextResponse.json({ note: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
