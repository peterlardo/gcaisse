import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.headers.set(
    'Set-Cookie',
    `lcg_token=; HttpOnly${secure}; SameSite=Lax; Max-Age=0; Path=/`
  )
  return response
}
