import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 })
    }

    const ext = path.extname(file.name) || '.bin'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    const dir = path.join(process.cwd(), 'public', 'uploads', 'messages')
    const filePath = path.join(dir, safeName)

    await mkdir(dir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const fileUrl = `/uploads/messages/${safeName}`

    return NextResponse.json({ fileUrl, fileName: file.name })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}
