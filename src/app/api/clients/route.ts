import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (type) where.type = type

    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { sales: true } } },
    })

    return NextResponse.json({ clients })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const client = await prisma.client.create({
      data: {
        name: body.name,
        type: body.type || 'PARTICULIER',
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        city: body.city || 'Brazzaville',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
