import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      }),
      prisma.loginLog.count(),
    ])

    return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
