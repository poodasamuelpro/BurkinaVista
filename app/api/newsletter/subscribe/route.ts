/**
 * app/api/newsletter/subscribe/route.ts — Abonnement newsletter
 * POST : email + nom optionnel
 * Insert dans abonnes, envoie email de bienvenue
 *
 * AUDIT 2026-05-01 — CORRECTIONS APPLIQUÉES :
 *  [NEWS-01] Rate-limiting par IP (5 abonnements / 10 min) — RATE_LIMITS.NEWSLETTER
 *            Empêche le spam d'inscriptions massives par un même attaquant.
 */
import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { sendWelcomeNewsletter } from '@/lib/email'
import { rateLimitByIp, RATE_LIMITS, rateLimitHeaders } from '@/lib/rate-limit'
import type { Abonne } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // [NEWS-01] Rate-limit par IP
  const rl = await rateLimitByIp(req, RATE_LIMITS.NEWSLETTER)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Merci de patienter quelques minutes.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const { email, nom } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    const existing = await queryOne<Abonne>(
      'SELECT * FROM abonnes WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (existing) {
      if (existing.actif) {
        return NextResponse.json(
          { message: 'Vous êtes déjà abonné(e) à la newsletter !' },
          { headers: rateLimitHeaders(rl) }
        )
      } else {
        await query(
          'UPDATE abonnes SET actif = true, nom = $1 WHERE email = $2',
          [nom || existing.nom, email.toLowerCase().trim()]
        )
        return NextResponse.json(
          { success: true, message: 'Votre abonnement a été réactivé !' },
          { headers: rateLimitHeaders(rl) }
        )
      }
    }

    await query(
      'INSERT INTO abonnes (email, nom, actif) VALUES ($1, $2, true)',
      [email.toLowerCase().trim(), nom || null]
    )

    sendWelcomeNewsletter(email, nom).catch((err) =>
      console.error('Erreur email bienvenue:', err)
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Vous êtes maintenant abonné(e) à la newsletter BurkinaVista !',
      },
      { headers: rateLimitHeaders(rl) }
    )
  } catch (error) {
    console.error('Erreur subscribe newsletter:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: rateLimitHeaders(rl) }
    )
  }
}
