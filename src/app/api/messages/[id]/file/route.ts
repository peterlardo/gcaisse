import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const mimeTypes: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain', csv: 'text/csv',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const message = await prisma.message.findUnique({
      where: { id: parseInt(params.id) },
      select: { id: true, fileData: true, fileName: true, senderId: true, recipientId: true },
    })

    if (!message || !message.fileData) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
    }

    if (message.recipientId !== user.id && message.senderId !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const buffer = Buffer.from(message.fileData, 'base64')
    const ext = (message.fileName || '').split('.').pop()?.toLowerCase() || 'bin'
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${message.fileName}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
