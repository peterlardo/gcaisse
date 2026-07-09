import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const box = searchParams.get('box') || 'inbox'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const skip = (page - 1) * limit

    const where: any = {}
    if (box === 'inbox') {
      where.recipientId = user.id
    } else if (box === 'sent') {
      where.senderId = user.id
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, email: true } },
          recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.message.count({ where }),
    ])

    const unreadCount = await prisma.message.count({
      where: { recipientId: user.id, isRead: false },
    })

    return NextResponse.json({ messages, total, page, totalPages: Math.ceil(total / limit), unreadCount })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()

    const recipient = await prisma.user.findUnique({
      where: { id: parseInt(body.recipientId) },
    })
    if (!recipient) {
      return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        subject: body.subject,
        content: body.content,
        senderId: user.id,
        recipientId: parseInt(body.recipientId),
        parentId: body.parentId ? parseInt(body.parentId) : null,
        fileUrl: body.fileUrl || null,
        fileName: body.fileName || null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
