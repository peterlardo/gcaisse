import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateReference } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const productId = searchParams.get('productId')
    const clientId = searchParams.get('clientId')
    const userId = searchParams.get('userId')
    const pointOfSaleId = searchParams.get('pointOfSaleId')

    const where: any = {}
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
    if (productId) where.items = { some: { productId: parseInt(productId) } }
    if (clientId) where.clientId = parseInt(clientId)
    if (userId) where.userId = parseInt(userId)
    if (pointOfSaleId) where.pointOfSaleId = parseInt(pointOfSaleId)

    if (user.role === 'CAISSIER' && user.pointOfSaleId) {
      where.pointOfSaleId = user.pointOfSaleId
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: true } },
        payments: true,
        user: { select: { firstName: true, lastName: true } },
        client: true,
        pointOfSale: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Sales error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['CAISSIER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const reference = generateReference('VNT')

    const sale = await prisma.$transaction(async (tx) => {
      let subtotal = 0
      const itemsData: any[] = []

      for (const item of body.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Produit ${item.productId} non trouvé`)

        const clientType = body.clientType || 'PARTICULIER'
        let unitPrice = product.priceParticulier
        if (clientType === 'PROFESSIONNEL') unitPrice = product.priceProfessionnel
        if (clientType === 'GROSSISTE') unitPrice = product.priceGrossiste
        if (item.unitPrice) unitPrice = item.unitPrice

        const total = unitPrice * item.quantity
        subtotal += total
        itemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice, total })
      }

      const discount = parseFloat(body.discount) || 0
      const total = subtotal - discount

      const sale = await tx.sale.create({
        data: {
          reference,
          pointOfSaleId: body.pointOfSaleId || user.pointOfSaleId || 1,
          userId: user.id,
          clientId: body.clientId || null,
          status: body.status || 'COMPTANT',
          subtotal,
          discount,
          discountLabel: body.discountLabel || null,
          total,
          paidAmount: body.paidAmount || total,
          notes: body.notes || null,
          items: { create: itemsData },
        },
        include: { items: { include: { product: true } }, client: true },
      })

      for (const item of body.items) {
        const stock = await tx.stockAtLocation.findFirst({
          where: {
            productId: item.productId,
            pointOfSaleId: body.pointOfSaleId || user.pointOfSaleId || 1,
            depotId: null,
          },
        })
        if (stock && stock.quantity >= item.quantity) {
          await tx.stockAtLocation.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } },
          })
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SORTIE',
            quantity: item.quantity,
            pointOfSaleId: body.pointOfSaleId || user.pointOfSaleId || 1,
            saleId: sale.id,
            userId: user.id,
            reason: 'Vente',
            reference,
          },
        })
      }

      if (body.paidAmount && body.paidAmount > 0) {
        const cashSession = await tx.cashRegisterSession.findFirst({
          where: {
            caisse: { pointOfSaleId: body.pointOfSaleId || user.pointOfSaleId || 1 },
            status: 'OUVERTE',
          },
        })

        await tx.payment.create({
          data: {
            saleId: sale.id,
            amount: body.paidAmount,
            method: body.paymentMethod || 'ESPÈCES',
            reference: body.paymentReference || null,
            userId: user.id,
          },
        })

        if (cashSession) {
          await tx.cashMovement.create({
            data: {
              sessionId: cashSession.id,
              userId: user.id,
              type: 'ENCAISSEMENT',
              amount: body.paidAmount,
              method: body.paymentMethod || 'ESPÈCES',
              reference: reference,
              description: `Paiement vente ${reference}`,
            },
          })
        }
      }

      return sale
    })

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error: any) {
    console.error('Sale create error:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
