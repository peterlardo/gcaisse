import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'lcg-secret-key-change-in-production'
const SALT_ROUNDS = 10

export interface JwtPayload {
  id: number
  username: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('lcg_token')?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { pointOfSale: true },
  })
  return user
}

export function requireRole(...roles: string[]) {
  return async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('Non authentifié')
    if (roles.length > 0 && !roles.includes(user.role)) {
      throw new Error('Accès non autorisé')
    }
    return user
  }
}
