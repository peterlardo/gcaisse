import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (productId) where.productId = parseInt(productId)
    if (type) where.type = type

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { product: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ movements })
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
    const movement = await prisma.$transaction(async (tx) => {
      const mvt = await tx.stockMovement.create({
        data: {
          productId: body.productId,
          type: body.type,
          quantity: body.quantity,
          pointOfSaleId: body.pointOfSaleId || null,
          depotId: body.depotId || null,
          userId: user.id,
          reason: body.reason || null,
          reference: body.reference || null,
          batchNumber: body.batchNumber || null,
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
        const isIncrease = body.type === 'ENTREE' || body.type === 'AJUSTEMENT'
        const qtyChange = isIncrease ? body.quantity : -body.quantity
        await tx.stockAtLocation.update({
          where: { id: stock.id },
          data: { quantity: { increment: qtyChange } },
        })
      }

      return mvt
    })

    return NextResponse.json({ movement }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
