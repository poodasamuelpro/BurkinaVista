/**
 * app/api/admin-logout/route.ts — Déconnexion admin
 * Supprime le cookie JWT et redirige vers la page de login
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_token')
  return response
}

export async function GET() {
  const response = NextResponse.redirect(
    new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  )
  response.cookies.delete('admin_token')
  return response
}
