import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const distId = parseInt(params.id)

    if (body.action === 'VALIDATE') {
      const distribution = await prisma.$transaction(async (tx) => {
        const dist = await tx.distribution.update({
          where: { id: distId },
          data: {
            status: 'LIVRE',
            validatedById: user.id,
            validatedAt: new Date(),
          },
          include: { items: true },
        })

        for (const item of dist.items) {
          const received = body.items?.find((i: any) => i.productId === item.productId)
          const qtyReceived = received?.quantityReceived || item.quantitySent
          const diff = qtyReceived - item.quantitySent

          await tx.distributionItem.update({
            where: { id: item.id },
            data: { quantityReceived: qtyReceived, difference: diff },
          })

          const stock = await tx.stockAtLocation.findFirst({
            where: {
              productId: item.productId,
              depotId: body.destDepotId,
              pointOfSaleId: null,
            },
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
              type: 'TRANSFERT',
              quantity: qtyReceived,
              depotId: body.destDepotId,
              userId: user.id,
              reason: 'Réception distribution',
              reference: dist.reference,
            },
          })
        }

        return dist
      })

      return NextResponse.json({ distribution })
    }

    if (body.action === 'CANCEL') {
      const distribution = await prisma.distribution.update({
        where: { id: distId },
        data: { status: 'ANNULE' },
      })
      return NextResponse.json({ distribution })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
