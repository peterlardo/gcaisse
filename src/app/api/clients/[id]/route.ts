import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const client = await prisma.client.update({
      where: { id: parseInt(params.id) },
      data: {
        name: body.name,
        type: body.type,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        notes: body.notes,
      },
    })

    return NextResponse.json({ client })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
