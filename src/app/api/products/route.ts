import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const active = searchParams.get('active')
    const search = searchParams.get('search')

    const where: any = {}
    if (type) where.type = type
    if (active === 'true') where.isActive = true
    if (search) where.name = { contains: search }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        type: body.type,
        categoryId: body.categoryId,
        unit: body.unit,
        priceParticulier: parseFloat(body.priceParticulier) || 0,
        priceProfessionnel: parseFloat(body.priceProfessionnel) || 0,
        priceGrossiste: parseFloat(body.priceGrossiste) || 0,
        minStockLevel: parseInt(body.minStockLevel) || 0,
        conservationDuration: body.conservationDuration ? parseInt(body.conservationDuration) : null,
        description: body.description || null,
        isActive: body.isActive !== false,
      },
      include: { category: true },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Product create error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
