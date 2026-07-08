import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Identifiants requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { pointOfSale: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Compte désactivé' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role })

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await prisma.loginLog.create({
      data: { userId: user.id, success: true },
    })

    const { password: _, ...userWithoutPassword } = user
    const response = NextResponse.json({ user: userWithoutPassword, token })
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    response.headers.set(
      'Set-Cookie',
      `lcg_token=${token}; HttpOnly${secure}; SameSite=Lax; Max-Age=86400; Path=/`
    )
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
