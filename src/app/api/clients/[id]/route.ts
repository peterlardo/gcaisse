import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) data.type = body.type
    if (body.phone !== undefined) data.phone = body.phone
    if (body.email !== undefined) data.email = body.email
    if (body.address !== undefined) data.address = body.address
    if (body.city !== undefined) data.city = body.city
    if (body.notes !== undefined) data.notes = body.notes
    if (body.reduceCredit !== undefined) {
      const client = await prisma.client.findUnique({ where: { id: parseInt(params.id) } })
      if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
      data.creditBalance = Math.max(0, client.creditBalance - body.reduceCredit)
    }
    const client = await prisma.client.update({
      where: { id: parseInt(params.id) },
      data,
    })

    return NextResponse.json({ client })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
