import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const depots = await prisma.depot.findMany({
      include: {
        _count: { select: { distributions: true, stockMovements: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ depots })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'DIRECTION'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    const depot = await prisma.depot.create({
      data: {
        name: body.name,
        code: body.code,
        address: body.address || null,
        city: body.city || 'Brazzaville',
        isActive: true,
      },
    })

    return NextResponse.json({ depot }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ce code ou nom existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'DIRECTION'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    const depot = await prisma.depot.update({
      where: { id: parseInt(body.id) },
      data: {
        name: body.name,
        code: body.code,
        address: body.address || null,
        city: body.city || 'Brazzaville',
        isActive: body.isActive === 'true' || body.isActive === true,
      },
    })

    return NextResponse.json({ depot })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ce code ou nom existe déjà' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    await prisma.depot.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
