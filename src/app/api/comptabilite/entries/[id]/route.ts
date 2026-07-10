import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const entry = await prisma.journalEntry.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        lines: { include: { account: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        validatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!entry) return NextResponse.json({ error: 'Écriture introuvable' }, { status: 404 })
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'DIRECTION'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const id = parseInt(params.id)

    if (body.action === 'VALIDATE') {
      const entry = await prisma.journalEntry.update({
        where: { id },
        data: {
          validated: true,
          validatedAt: new Date(),
          validatedById: user.id,
        },
        include: {
          lines: { include: { account: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          validatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      })
      return NextResponse.json({ entry })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
