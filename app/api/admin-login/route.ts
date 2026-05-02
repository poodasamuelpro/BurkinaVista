/**
 * app/api/admin-login/route.ts — Connexion admin par email + mot de passe
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-05-01) :
 *  [LOGIN-01] Comparaison du mot de passe en clair par égalité de chaînes
 *             → Utilisation de verifyAdminPassword() (lib/admin-password.ts) qui
 *               supporte ADMIN_PASSWORD_HASH (scrypt) ET ADMIN_PASSWORD (legacy)
 *               avec comparaison constant-time pour éviter le timing attack.
 *             → Pour migrer : `node scripts/generate-admin-hash.mjs "<pwd>"`
 *               et coller le résultat dans Vercel comme ADMIN_PASSWORD_HASH.
 *               L'ancienne ADMIN_PASSWORD peut alors être supprimée.
 *  [LOGIN-02] Aucune protection brute-force → ajout rate-limit Upstash
 *             5 tentatives par 5 minutes par IP (RATE_LIMITS.ADMIN_LOGIN).
 *  [LOGIN-03] Aucune vérification captcha → ajout vérification Turnstile
 *             via le header X-Turnstile-Token ou le champ "turnstileToken"
 *             du body. Si Turnstile n'est pas configuré, vérification skippée
 *             (failsafe pour migration progressive).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminToken } from '@/lib/auth'
import { verifyAdminPassword } from '@/lib/admin-password'
import { rateLimitByIp, RATE_LIMITS, rateLimitHeaders, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // [LOGIN-02] Rate-limit par IP (5 / 5 min)
  const rl = await rateLimitByIp(req, RATE_LIMITS.ADMIN_LOGIN)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const body = await req.json()
    const { email, password, turnstileToken } = body as {
      email?: string
      password?: string
      turnstileToken?: string
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    // [LOGIN-03] Captcha Turnstile (skip si non configuré)
    const headerToken = req.headers.get('x-turnstile-token')
    const captchaToken = headerToken || turnstileToken
    const captchaOk = await verifyTurnstile(captchaToken, getClientIp(req))
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Vérification anti-spam échouée. Veuillez réessayer.' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.error('[admin-login] ADMIN_EMAIL non défini')
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500, headers: rateLimitHeaders(rl) }
      )
    }

    // Vérification email (case-insensitive)
    const emailMatch =
      email.toLowerCase().trim() === adminEmail.toLowerCase().trim()

    // [LOGIN-01] Vérification mot de passe via hash scrypt ou comparaison constant-time
    const passwordMatch = await verifyAdminPassword(password)

    if (!emailMatch || !passwordMatch) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401, headers: rateLimitHeaders(rl) }
      )
    }

    // Créer le token JWT (expire 24h)
    const token = await createAdminToken()

    const response = NextResponse.json(
      { success: true },
      { headers: rateLimitHeaders(rl) }
    )
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[admin-login] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: rateLimitHeaders(rl) }
    )
  }
}
