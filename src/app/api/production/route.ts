import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateReference } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const batches = await prisma.productionBatch.findMany({
      include: {
        product: true,
        user: { select: { firstName: true, lastName: true } },
        destinationDepot: true,
      },
      orderBy: { productionDate: 'desc' },
      take: 100,
    })

    return NextResponse.json({ batches })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'RESPONSABLE_PRODUCTION'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const batchNumber = generateReference('PROD')

    const batch = await prisma.$transaction(async (tx) => {
      const batch = await tx.productionBatch.create({
        data: {
          batchNumber,
          productId: body.productId,
          quantityProduced: parseInt(body.quantityProduced) || 0,
          quantityLost: parseInt(body.quantityLost) || 0,
          notes: body.notes || null,
          destinationDepotId: body.destinationDepotId || null,
          productionDate: body.productionDate ? new Date(body.productionDate) : new Date(),
          userId: user.id,
        },
      })

      if (body.destinationDepotId) {
        const stock = await tx.stockAtLocation.findFirst({
          where: {
            productId: body.productId,
            depotId: body.destinationDepotId,
            pointOfSaleId: null,
          },
        })
        if (stock) {
          await tx.stockAtLocation.update({
            where: { id: stock.id },
            data: { quantity: { increment: parseInt(body.quantityProduced) || 0 } },
          })
        }

        await tx.stockMovement.create({
          data: {
            productId: body.productId,
            type: 'ENTRÉE',
            quantity: parseInt(body.quantityProduced) || 0,
            depotId: body.destinationDepotId,
            userId: user.id,
            reason: 'Production',
            reference: batchNumber,
            batchNumber,
          },
        })

        if (parseInt(body.quantityLost) > 0) {
          await tx.stockMovement.create({
            data: {
              productId: body.productId,
              type: 'PERTE',
              quantity: parseInt(body.quantityLost) || 0,
              depotId: body.destinationDepotId,
              userId: user.id,
              reason: 'Perte de production',
              reference: batchNumber,
              batchNumber,
            },
          })
        }
      }

      return batch
    })

    return NextResponse.json({ batch }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
