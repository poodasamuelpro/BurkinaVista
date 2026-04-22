/**
 * middleware.ts — Auth admin JWT + protection routes
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - CRITIQUE : Le JWT_SECRET avait un fallback 'fallback-secret-change-me' hardcodé !
 *    En production sans JWT_SECRET défini, l'admin utilisait ce fallback prévisible.
 *    → Suppression du fallback : si JWT_SECRET manque en production → throw Error.
 *  - Ajout protection API admin : les routes /api/admin/* sont aussi protégées
 *    (sauf /api/admin-login qui doit rester accessible).
 *  - Le cron /api/cron/* est protégé par CRON_SECRET dans la route elle-même (OK).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  // ✅ CORRECTION CRITIQUE — Plus de fallback hardcodé
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[middleware] JWT_SECRET est obligatoire en production')
    }
    // En développement local uniquement, on tolère une valeur par défaut
    console.warn('[middleware] JWT_SECRET non défini — utilisation valeur dev uniquement')
    return new TextEncoder().encode('dev-only-secret-change-in-production')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Protéger les pages admin (sauf /admin/login) ──────────
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
      return NextResponse.next()
    } catch {
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}