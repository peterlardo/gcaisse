import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const inventories = await prisma.inventory.findMany({
      include: { product: true, user: { select: { firstName: true, lastName: true } }, pointOfSale: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ inventories })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'RESPONSABLE_STOCK'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const inventory = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.create({
        data: {
          productId: body.productId,
          pointOfSaleId: body.pointOfSaleId || null,
          theoreticalQty: body.theoreticalQty || 0,
          actualQty: body.actualQty || 0,
          difference: (body.actualQty || 0) - (body.theoreticalQty || 0),
          reason: body.reason || null,
          locationType: body.pointOfSaleId ? 'POINT_OF_SALE' : 'DEPOT',
          locationName: body.locationName || null,
          userId: user.id,
        },
      })

      const whereFilter: any = { productId: body.productId }
      if (body.pointOfSaleId) {
        whereFilter.pointOfSaleId = body.pointOfSaleId
        whereFilter.depotId = null
      } else if (body.depotId) {
        whereFilter.depotId = body.depotId
        whereFilter.pointOfSaleId = null
      }

      const stock = await tx.stockAtLocation.findFirst({ where: whereFilter })
      if (stock) {
        await tx.stockAtLocation.update({
          where: { id: stock.id },
          data: { quantity: body.actualQty },
        })
      }

      if (inv.difference !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: body.productId,
            type: 'AJUSTEMENT',
            quantity: Math.abs(inv.difference),
            pointOfSaleId: body.pointOfSaleId || null,
            depotId: body.depotId || null,
            userId: user.id,
            reason: `Inventaire: ${body.reason || 'Ajustement'} (${inv.difference > 0 ? '+' : ''}${inv.difference})`,
          },
        })
      }

      return inv
    })

    return NextResponse.json({ inventory }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
