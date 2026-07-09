import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) },
      include: { category: true, stockAtLocation: { include: { pointOfSale: true, depot: true } } },
    })
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const product = await prisma.product.update({
      where: { id: parseInt(params.id) },
      data: {
        name: body.name,
        type: body.type,
        categoryId: parseInt(body.categoryId),
        unit: body.unit,
        priceParticulier: parseFloat(body.priceParticulier) || 0,
        priceProfessionnel: parseFloat(body.priceProfessionnel) || 0,
        priceGrossiste: parseFloat(body.priceGrossiste) || 0,
        minStockLevel: parseInt(body.minStockLevel) || 0,
        conservationDuration: body.conservationDuration ? parseInt(body.conservationDuration) : null,
        description: body.description,
        isActive: body.isActive === 'true' || body.isActive === true,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.product.update({
      where: { id: parseInt(params.id) },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
