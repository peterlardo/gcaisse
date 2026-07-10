import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateReference } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          lines: { include: { account: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.journalEntry.count({ where }),
    ])

    return NextResponse.json({ entries, total, page, totalPages: Math.ceil(total / limit) })
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
    const reference = generateReference('EC')

    if (!body.lines || body.lines.length < 2) {
      return NextResponse.json({ error: 'Une écriture doit avoir au moins 2 lignes' }, { status: 400 })
    }

    const totalDebit = body.lines.reduce((s: number, l: any) => s + (parseFloat(l.debit) || 0), 0)
    const totalCredit = body.lines.reduce((s: number, l: any) => s + (parseFloat(l.credit) || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: 'Le total des débits doit être égal au total des crédits' }, { status: 400 })
    }

    const entry = await prisma.journalEntry.create({
      data: {
        reference,
        label: body.label,
        description: body.description || null,
        date: body.date ? new Date(body.date) : new Date(),
        userId: user.id,
        lines: {
          create: body.lines.map((l: any) => ({
            accountId: parseInt(l.accountId),
            label: l.label || null,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
          })),
        },
      },
      include: {
        lines: { include: { account: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
