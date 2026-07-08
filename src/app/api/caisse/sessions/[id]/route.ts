import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const sessionId = parseInt(params.id)

    if (body.action === 'CLOSE') {
      const sales = await prisma.sale.findMany({
        where: { cashSessionId: sessionId },
      })
      const expectedClosing = sales.reduce((sum, s) => sum + s.paidAmount, 0) + (body.closingBalance || 0)
      const difference = (body.closingBalance || 0) - expectedClosing

      const session = await prisma.cashRegisterSession.update({
        where: { id: sessionId },
        data: {
          status: 'FERMÉE',
          closingBalance: parseFloat(body.closingBalance) || 0,
          expectedClosing,
          difference,
          notes: body.notes || null,
          closedAt: new Date(),
        },
        include: { caisse: true, user: { select: { firstName: true, lastName: true } } },
      })

      if (difference !== 0) {
        await prisma.alert.create({
          data: {
            type: 'CAISSE',
            message: `Écart de caisse de ${difference > 0 ? '+' : ''}${difference} FCFA sur ${session.caisse.name}`,
            severity: difference !== 0 ? 'WARNING' : 'INFO',
            userId: user.id,
          },
        })
      }

      return NextResponse.json({ session })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
