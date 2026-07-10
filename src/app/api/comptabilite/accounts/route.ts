import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const accounts = await prisma.accountingAccount.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { children: true } } },
    })
    return NextResponse.json({ accounts })
  } catch {
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
    const account = await prisma.accountingAccount.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type || 'ACTIF',
        nature: body.nature || 'DEBIT',
        parentId: body.parentId ? parseInt(body.parentId) : null,
      },
    })
    return NextResponse.json({ account }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Ce code comptable existe déjà' }, { status: 409 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
