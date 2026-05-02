/**
 * app/api/report/route.ts — Signalement public d'un média
 *
 * AJOUT (Audit 2026-05-01) — Item #14 :
 *  Système de modération communautaire. Permet à tout visiteur de signaler un
 *  média qu'il juge inapproprié (contenu violent, droit d'auteur, info erronée…).
 *
 *  Caractéristiques :
 *   - Rate-limit IP (10 signalements / heure) pour éviter le spam admin
 *   - Captcha Turnstile (skip si non configuré)
 *   - Validation stricte : UUID média, motif borné, message borné, email optionnel
 *   - Stockage dans media_reports (migration neon-migration.sql)
 *   - Réponse neutre (200 même si déjà signalé) pour ne pas leak l'état
 */
import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { rateLimitByIp, RATE_LIMITS, rateLimitHeaders, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { UUID_V4_REGEX } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_REASONS = [
  'inappropriate',  // Contenu inapproprié
  'copyright',      // Atteinte au droit d'auteur
  'incorrect_info', // Informations erronées
  'spam',           // Spam / publicité
  'illegal',        // Contenu illégal
  'other',          // Autre motif (préciser dans message)
] as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  // Rate-limit (10 signalements / heure / IP)
  const rl = await rateLimitByIp(req, RATE_LIMITS.REPORT)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de signalements. Merci de patienter avant de réessayer.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const body = await req.json()
    const { mediaId, reason, message, email, turnstileToken } = body as {
      mediaId?: string
      reason?: string
      message?: string
      email?: string
      turnstileToken?: string
    }

    // Captcha (skip si non configuré)
    const headerToken = req.headers.get('x-turnstile-token')
    const captchaToken = headerToken || turnstileToken
    const captchaOk = await verifyTurnstile(captchaToken, getClientIp(req))
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Vérification anti-spam échouée.' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    // Validation
    if (!mediaId || typeof mediaId !== 'string' || !UUID_V4_REGEX.test(mediaId)) {
      return NextResponse.json(
        { error: 'mediaId invalide' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }
    if (!reason || typeof reason !== 'string' || !(ALLOWED_REASONS as readonly string[]).includes(reason)) {
      return NextResponse.json(
        { error: `Motif invalide. Valeurs acceptées : ${ALLOWED_REASONS.join(', ')}` },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }
    if (message && typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message invalide' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }
    if (email && (typeof email !== 'string' || !EMAIL_REGEX.test(email))) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    // Vérifier que le média existe
    const media = await queryOne<{ id: string; titre: string }>(
      'SELECT id, titre FROM medias WHERE id = $1',
      [mediaId]
    )
    if (!media) {
      return NextResponse.json(
        { error: 'Média introuvable' },
        { status: 404, headers: rateLimitHeaders(rl) }
      )
    }

    const ip = getClientIp(req)
    const safeMessage = message ? String(message).substring(0, 1000) : null
    const safeEmail = email ? String(email).toLowerCase().trim().substring(0, 200) : null

    await query(
      `INSERT INTO media_reports (media_id, reason, message, reporter_email, reporter_ip)
       VALUES ($1, $2, $3, $4, $5::inet)`,
      [mediaId, reason, safeMessage, safeEmail, ip === 'unknown' ? null : ip]
    )

    return NextResponse.json(
      { success: true, message: 'Merci, votre signalement a été transmis à notre équipe.' },
      { headers: rateLimitHeaders(rl) }
    )
  } catch (error) {
    console.error('[report] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: rateLimitHeaders(rl) }
    )
  }
}
