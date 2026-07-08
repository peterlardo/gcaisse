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

    const orders = await prisma.order.findMany({
      where,
      include: {
        client: true,
        user: { select: { firstName: true, lastName: true } },
        pointOfSale: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const reference = generateReference('CMD')

    let total = 0
    const itemsData = []
    for (const item of body.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) continue
      const unitPrice = body.clientType === 'PROFESSIONNEL' ? product.priceProfessionnel
        : body.clientType === 'GROSSISTE' ? product.priceGrossiste
        : product.priceParticulier
      const itemTotal = unitPrice * item.quantity
      total += itemTotal
      itemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice, total: itemTotal })
    }

    const order = await prisma.order.create({
      data: {
        reference,
        clientId: body.clientId,
        pointOfSaleId: body.pointOfSaleId || user.pointOfSaleId || 1,
        status: 'EN_ATTENTE',
        deliveryAddress: body.deliveryAddress || null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        notes: body.notes || null,
        total,
        userId: user.id,
        items: { create: itemsData },
      },
      include: { client: true, items: { include: { product: true } } },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
