import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const caisses = await prisma.caisse.findMany({
      where: { isActive: true },
      include: { pointOfSale: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ caisses })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
