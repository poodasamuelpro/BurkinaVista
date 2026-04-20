/**
 * middleware.ts — Authentification admin simplifiée avec JWT
 * Vérifie uniquement le cookie JWT admin sur /admin/*
 * Pas de Supabase Auth — cookie httpOnly sécurisé
 */
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-me'
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Protéger uniquement les routes /admin/* (sauf /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin_token')?.value

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(adminToken, getJwtSecret())
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      // Token valide — continuer
      return NextResponse.next()
    } catch {
      // Token invalide ou expiré — rediriger vers login
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_token')
      return response
    }
  }

  // Toutes les autres routes sont publiques
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
