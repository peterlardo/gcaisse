import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const pointsOfSale = await prisma.pointOfSale.findMany({
      where: { isActive: true },
      include: { _count: { select: { sales: true, users: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ pointsOfSale })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
