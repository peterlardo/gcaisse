import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const pointOfSaleId = searchParams.get('pointOfSaleId')
    const depotId = searchParams.get('depotId')

    const where: any = {}
    if (pointOfSaleId) where.pointOfSaleId = parseInt(pointOfSaleId)
    if (depotId) where.depotId = parseInt(depotId)
    if (user.role === 'CAISSIER' && user.pointOfSaleId) {
      where.pointOfSaleId = user.pointOfSaleId
    }

    const stock = await prisma.stockAtLocation.findMany({
      where,
      include: {
        product: { include: { category: true } },
        pointOfSale: true,
        depot: true,
      },
      orderBy: [{ product: { name: 'asc' } }],
    })

    return NextResponse.json({ stock })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
