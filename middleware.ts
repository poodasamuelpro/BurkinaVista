/**
 * middleware.ts — Auth admin JWT + protection routes
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - CRITIQUE : Le JWT_SECRET avait un fallback 'fallback-secret-change-me' hardcodé
 *    → Suppression du fallback : si JWT_SECRET manque en production → throw Error.
 *  - Ajout protection API admin : les routes /api/admin/* sont aussi protégées
 *    (sauf /api/admin-login qui doit rester accessible).
 *
 * AUDIT 2026-05-01 — NOUVELLES CORRECTIONS :
 *  [MID-01] Le matcher du middleware ne couvrait que '/admin/:path*' et NE protégeait
 *           PAS les routes /api/admin/*. La protection reposait uniquement sur la
 *           discipline en-route (checkAdmin appelé manuellement). Désormais le
 *           middleware applique aussi la vérification JWT sur /api/admin/*.
 *           /api/admin-login (login form) reste accessible sans token.
 *  [MID-02] Pour les routes API, on retourne un 401 JSON (pas une redirection) :
 *           plus correct côté client/fetch que de redirect 302 vers /admin/login.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[middleware] JWT_SECRET est obligatoire en production')
    }
    console.warn('[middleware] JWT_SECRET non défini — utilisation valeur dev uniquement')
    return new TextEncoder().encode('dev-only-secret-change-in-production')
  }
  return new TextEncoder().encode(secret)
}

async function isValidAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const adminToken = request.cookies.get('admin_token')?.value

  // ── [MID-01] Protection des routes /api/admin/* ───────────────
  // Note : /api/admin-login est exclu via le matcher (pas de path admin/)
  if (pathname.startsWith('/api/admin/')) {
    if (!(await isValidAdmin(adminToken))) {
      // [MID-02] Réponse JSON 401 au lieu d'une redirection HTML
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // ── Protéger les pages admin (sauf /admin/login) ──────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!(await isValidAdmin(adminToken))) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      if (adminToken) response.cookies.delete('admin_token')
      return response
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Pages admin
    '/admin/:path*',
    // [MID-01] Routes API admin (hors /api/admin-login)
    '/api/admin/:path*',
  ],
}
