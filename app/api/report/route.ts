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
 *
 * CORRECTION (2026-05-02) — Option C :
 *   - Email obligatoire côté serveur pour les motifs `copyright` et `illegal`
 *
 * FIX (2026-05-06) — Emails signalement :
 *   - Email à l'admin à chaque nouveau signalement (toujours)
 *   - Email de confirmation au signalant s'il a fourni son email
 *   - Pour copyright/illegal : email obligatoire → confirmation toujours envoyée
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { query, queryOne } from '@/lib/db'
import { rateLimitByIp, RATE_LIMITS, rateLimitHeaders, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { UUID_V4_REGEX, escapeHtml } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@burkinavista.poodasamuel.com'
const FROM_DISPLAY = `BurkinaVista <${FROM_EMAIL}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

const ALLOWED_REASONS = [
  'inappropriate',
  'copyright',
  'incorrect_info',
  'spam',
  'illegal',
  'other',
] as const

type ReportReason = typeof ALLOWED_REASONS[number]

/** Motifs pour lesquels l'email est obligatoire (suivi légal) */
const EMAIL_REQUIRED_REASONS: ReportReason[] = ['copyright', 'illegal']

/** Labels FR des motifs */
const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: 'Contenu inapproprié',
  copyright:     'Atteinte au droit d\'auteur',
  incorrect_info:'Informations erronées',
  spam:          'Spam / publicité',
  illegal:       'Contenu illégal',
  other:         'Autre motif',
}

/** Couleurs badge par motif (pour l'email admin) */
const REASON_COLORS: Record<ReportReason, string> = {
  inappropriate: '#E87722',
  copyright:     '#EF2B2D',
  incorrect_info:'#EFC031',
  spam:          '#888888',
  illegal:       '#C41E20',
  other:         '#555555',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Helper email : notification admin ────────────────────────────────────────

async function sendReportToAdmin(params: {
  mediaTitre: string
  mediaSlug: string
  mediaId: string
  reason: ReportReason
  message: string | null
  reporterEmail: string | null
  reportId: string
}): Promise<void> {
  if (!ADMIN_EMAIL) return

  const { mediaTitre, mediaSlug, mediaId, reason, message, reporterEmail, reportId } = params
  const safeMediaTitre = escapeHtml(mediaTitre)
  const safeReason = escapeHtml(REASON_LABELS[reason] || reason)
  const safeMessage = message ? escapeHtml(message) : null
  const safeReporterEmail = reporterEmail ? escapeHtml(reporterEmail) : null
  const isGrave = ['copyright', 'illegal'].includes(reason)
  const badgeColor = REASON_COLORS[reason] || '#555555'
  const mediaUrl = `${APP_URL}/photos/${encodeURIComponent(mediaSlug)}`
  const adminReportsUrl = `${APP_URL}/admin/reports`

  try {
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: ADMIN_EMAIL,
      subject: `🚨 Nouveau signalement${isGrave ? ' [URGENT]' : ''} — ${REASON_LABELS[reason]} — BurkinaVista`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:28px;">
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="16" fill="#EF2B2D"/>
        <rect y="16" width="48" height="16" fill="#009A00"/>
        <polygon points="24,7 25.8,13 31.2,13 26.9,16.8 28.5,22.5 24,19 19.5,22.5 21.1,16.8 16.8,13 22.2,13" fill="#EFC031"/>
      </svg>
      <p style="color:#EFC031;font-size:18px;font-weight:bold;margin-top:8px;">BurkinaVista</p>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">Nouveau signalement reçu</p>
    </div>

    ${isGrave ? `
    <div style="background:rgba(239,43,45,0.12);border:1px solid rgba(239,43,45,0.4);border-radius:12px;padding:16px 20px;margin-bottom:20px;text-align:center;">
      <p style="color:#EF2B2D;font-weight:bold;font-size:15px;margin:0;">⚠️ Signalement à traitement prioritaire</p>
      <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:6px 0 0 0;">Ce motif (${safeReason}) nécessite un suivi légal.</p>
    </div>` : ''}

    <div style="background:#1A1A2E;border-radius:16px;padding:28px;border:1px solid rgba(255,255,255,0.08);margin-bottom:20px;">

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;">${safeReason}</span>
        <span style="color:rgba(255,255,255,0.3);font-size:12px;">${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);font-size:13px;width:38%;">Média signalé</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;">
            <a href="${mediaUrl}" style="color:#EFC031;text-decoration:none;font-weight:bold;">${safeMediaTitre}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);font-size:13px;">Motif</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;font-weight:bold;">${safeReason}</td>
        </tr>
        ${safeReporterEmail ? `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);font-size:13px;">Email signalant</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#EFC031;font-size:13px;">${safeReporterEmail}</td>
        </tr>` : `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);font-size:13px;">Email signalant</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.25);font-size:13px;font-style:italic;">Anonyme</td>
        </tr>`}
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.35);font-size:13px;">ID signalement</td>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:11px;font-family:monospace;">${reportId}</td>
        </tr>
      </table>

      ${safeMessage ? `
      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px;margin-top:20px;border-left:3px solid ${badgeColor};">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px 0;">Message du signalant</p>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${safeMessage}</p>
      </div>` : ''}
    </div>

    <div style="text-align:center;">
      <a href="${adminReportsUrl}" style="display:inline-block;background:linear-gradient(135deg,#EFC031,#C9A025);color:#000;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:bold;font-size:15px;">
        Gérer ce signalement
      </a>
    </div>

    <p style="text-align:center;color:rgba(255,255,255,0.15);font-size:11px;margin-top:28px;">
      © ${new Date().getFullYear()} BurkinaVista — Administration
    </p>
  </div>
</body>
</html>
      `,
    })
  } catch (err) {
    console.error('[report] Erreur envoi email admin:', err)
  }
}

// ─── Helper email : confirmation au signalant ──────────────────────────────────

async function sendReportConfirmationToReporter(params: {
  reporterEmail: string
  mediaTitre: string
  reason: ReportReason
  isGrave: boolean
}): Promise<void> {
  const { reporterEmail, mediaTitre, reason, isGrave } = params
  const safeMediaTitre = escapeHtml(mediaTitre)
  const safeReason = escapeHtml(REASON_LABELS[reason] || reason)

  try {
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: reporterEmail,
      subject: `Votre signalement a bien été reçu — BurkinaVista`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:28px;">
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="16" fill="#EF2B2D"/>
        <rect y="16" width="48" height="16" fill="#009A00"/>
        <polygon points="24,7 25.8,13 31.2,13 26.9,16.8 28.5,22.5 24,19 19.5,22.5 21.1,16.8 16.8,13 22.2,13" fill="#EFC031"/>
      </svg>
      <p style="color:#EFC031;font-size:18px;font-weight:bold;margin-top:8px;">BurkinaVista</p>
    </div>

    <div style="background:#1A1A2E;border-radius:16px;padding:36px;border:1px solid rgba(239,192,49,0.15);">
      <h1 style="color:#EFC031;font-size:22px;margin:0 0 16px 0;">Signalement reçu ✅</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px 0;">
        Merci pour votre signalement concernant le média
        <strong style="color:#fff;">"${safeMediaTitre}"</strong>.
      </p>

      <div style="background:rgba(239,192,49,0.08);border-radius:10px;padding:16px 20px;border:1px solid rgba(239,192,49,0.2);margin-bottom:20px;">
        <p style="color:#EFC031;font-size:13px;font-weight:bold;margin:0 0 6px 0;">Motif signalé</p>
        <p style="color:#fff;font-size:14px;margin:0;">${safeReason}</p>
      </div>

      ${isGrave ? `
      <div style="background:rgba(239,43,45,0.08);border-radius:10px;padding:16px 20px;border:1px solid rgba(239,43,45,0.2);margin-bottom:20px;">
        <p style="color:#EF2B2D;font-size:13px;font-weight:bold;margin:0 0 6px 0;">⚖️ Signalement prioritaire</p>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0;">
          Ce type de signalement est traité en priorité par notre équipe.
          Nous vous contacterons à cette adresse email si des informations complémentaires sont nécessaires.
        </p>
      </div>` : `
      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <p style="color:rgba(255,255,255,0.4);font-size:13px;font-weight:bold;margin:0 0 6px 0;">⏱️ Délai de traitement</p>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">
          Notre équipe examine votre signalement sous <strong style="color:#fff;">48 heures</strong>.
        </p>
      </div>`}

      <p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;margin:0;">
        Pour toute question urgente, contactez-nous à
        <a href="mailto:${ADMIN_EMAIL}" style="color:#EFC031;text-decoration:none;">${ADMIN_EMAIL}</a>
      </p>
    </div>

    <p style="text-align:center;color:rgba(255,255,255,0.15);font-size:11px;margin-top:24px;">
      © ${new Date().getFullYear()} BurkinaVista
    </p>
  </div>
</body>
</html>
      `,
    })
  } catch (err) {
    console.error('[report] Erreur envoi email confirmation signalant:', err)
  }
}

// ─── Route principale ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

    // Validation mediaId
    if (!mediaId || typeof mediaId !== 'string' || !UUID_V4_REGEX.test(mediaId)) {
      return NextResponse.json({ error: 'mediaId invalide' }, { status: 400, headers: rateLimitHeaders(rl) })
    }

    // Validation reason
    if (!reason || typeof reason !== 'string' || !(ALLOWED_REASONS as readonly string[]).includes(reason)) {
      return NextResponse.json(
        { error: `Motif invalide. Valeurs : ${ALLOWED_REASONS.join(', ')}` },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }
    const safeReason = reason as ReportReason

    // Validation message
    if (message && typeof message !== 'string') {
      return NextResponse.json({ error: 'message invalide' }, { status: 400, headers: rateLimitHeaders(rl) })
    }

    // Validation email
    if (email && (typeof email !== 'string' || !EMAIL_REGEX.test(email))) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400, headers: rateLimitHeaders(rl) })
    }

    // Email OBLIGATOIRE pour copyright et illegal (suivi légal)
    const isGrave = EMAIL_REQUIRED_REASONS.includes(safeReason)
    if (isGrave && (!email || !EMAIL_REGEX.test(email))) {
      return NextResponse.json(
        { error: 'Votre email est obligatoire pour ce type de signalement (suivi légal requis).' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    // Vérifier que le média existe
    const media = await queryOne<{ id: string; titre: string; slug: string }>(
      'SELECT id, titre, slug FROM medias WHERE id = $1',
      [mediaId]
    )
    if (!media) {
      return NextResponse.json({ error: 'Média introuvable' }, { status: 404, headers: rateLimitHeaders(rl) })
    }

    const ip = getClientIp(req)
    const safeMessage = message ? String(message).substring(0, 1000) : null
    const safeEmail = email ? String(email).toLowerCase().trim().substring(0, 200) : null

    // Insertion en base
    const [inserted] = await query<{ id: string }>(
      `INSERT INTO media_reports (media_id, reason, message, reporter_email, reporter_ip)
       VALUES ($1, $2, $3, $4, $5::inet)
       RETURNING id`,
      [mediaId, safeReason, safeMessage, safeEmail, ip === 'unknown' ? null : ip]
    )

    const reportId = inserted?.id || 'inconnu'

    // Emails — non bloquants (Promise.all sans await bloquant)
    const emailTasks: Promise<void>[] = []

    // 1. Email admin — toujours
    emailTasks.push(sendReportToAdmin({
      mediaTitre: media.titre,
      mediaSlug: media.slug,
      mediaId: media.id,
      reason: safeReason,
      message: safeMessage,
      reporterEmail: safeEmail,
      reportId,
    }))

    // 2. Email signalant — si email fourni
    if (safeEmail) {
      emailTasks.push(sendReportConfirmationToReporter({
        reporterEmail: safeEmail,
        mediaTitre: media.titre,
        reason: safeReason,
        isGrave,
      }))
    }

    // Fire-and-forget — on n'attend pas les emails pour répondre
    Promise.all(emailTasks).catch((err) =>
      console.error('[report] Erreur emails signalement:', err)
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
