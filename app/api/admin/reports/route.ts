/**
 * app/api/admin/reports/route.ts — API admin pour les signalements
 *
 * AJOUT (Audit 2026-05-01) — Item #14 :
 *  GET   : liste les signalements (filtre par statut optionnel)
 *  PATCH : met à jour le statut d'un signalement
 *
 * FIX (2026-05-06) — Emails après traitement :
 *  - Si statut → 'resolved' ou 'actioned' ET signalant a un email
 *    → email de notification envoyé au signalant
 *  - Si statut → 'dismissed' → pas d'email (rejet silencieux)
 *  - Email obligatoire pour copyright/illegal → confirmation de résolution
 *    avec message légal approprié
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryMany, queryOne } from '@/lib/db'
import { UUID_V4_REGEX, escapeHtml } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@burkinavista.poodasamuel.com'
const FROM_DISPLAY = `BurkinaVista <${FROM_EMAIL}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

const ALLOWED_STATUSES = ['pending', 'review', 'resolved', 'dismissed', 'actioned'] as const
type ReportStatus = typeof ALLOWED_STATUSES[number]

/** Statuts qui déclenchent un email au signalant */
const NOTIFY_STATUSES: ReportStatus[] = ['resolved', 'actioned']

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Contenu inapproprié',
  copyright:     'Atteinte au droit d\'auteur',
  incorrect_info:'Informations erronées',
  spam:          'Spam / publicité',
  illegal:       'Contenu illégal',
  other:         'Autre motif',
}

interface ReportWithMedia {
  id: string
  media_id: string
  reason: string
  message: string | null
  reporter_email: string | null
  reporter_ip: string | null
  statut: string
  admin_note: string | null
  created_at: string
  updated_at: string
  media_titre: string | null
  media_slug: string | null
  media_type: string | null
}

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

// ─── Email : résolution envoyée au signalant ──────────────────────────────────

async function sendResolutionToReporter(params: {
  reporterEmail: string
  mediaTitre: string
  reason: string
  statut: ReportStatus
  adminNote: string | null
}): Promise<void> {
  const { reporterEmail, mediaTitre, reason, statut, adminNote } = params
  const safeMediaTitre = escapeHtml(mediaTitre)
  const safeReason = escapeHtml(REASON_LABELS[reason] || reason)
  const safeAdminNote = adminNote ? escapeHtml(adminNote) : null
  const isGrave = ['copyright', 'illegal'].includes(reason)

  const statusMessages: Record<ReportStatus, { title: string; color: string; body: string }> = {
    resolved: {
      title: 'Signalement résolu ✅',
      color: '#009A00',
      body: 'Votre signalement a été examiné et traité par notre équipe. Le contenu a été modifié ou retiré conformément à nos règles.',
    },
    actioned: {
      title: 'Action prise suite à votre signalement ✅',
      color: '#EFC031',
      body: isGrave
        ? 'Votre signalement a été traité en priorité. Des mesures appropriées ont été prises conformément à la législation en vigueur.'
        : 'Votre signalement a été pris en compte et des mesures ont été appliquées.',
    },
    pending: { title: '', color: '', body: '' },
    review: { title: '', color: '', body: '' },
    dismissed: { title: '', color: '', body: '' },
  }

  const msg = statusMessages[statut]
  if (!msg.title) return

  try {
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: reporterEmail,
      subject: `${statut === 'resolved' ? 'Résolution' : 'Traitement'} de votre signalement — BurkinaVista`,
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

    <div style="background:#1A1A2E;border-radius:16px;padding:36px;border:1px solid rgba(255,255,255,0.08);">
      <h1 style="color:${msg.color};font-size:22px;margin:0 0 16px 0;">${msg.title}</h1>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px 0;">
        Concernant votre signalement sur le média
        <strong style="color:#fff;">"${safeMediaTitre}"</strong>
        (motif : ${safeReason}).
      </p>

      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 20px;border-left:3px solid ${msg.color};margin-bottom:20px;">
        <p style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;margin:0;">${msg.body}</p>
      </div>

      ${safeAdminNote ? `
      <div style="background:rgba(239,192,49,0.06);border-radius:10px;padding:16px 20px;border:1px solid rgba(239,192,49,0.15);margin-bottom:20px;">
        <p style="color:#EFC031;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px 0;">Note de l'équipe</p>
        <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${safeAdminNote}</p>
      </div>` : ''}

      ${isGrave ? `
      <div style="background:rgba(239,43,45,0.06);border-radius:10px;padding:14px 18px;border:1px solid rgba(239,43,45,0.2);margin-bottom:20px;">
        <p style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.6;margin:0;">
          ⚖️ Pour tout suivi légal complémentaire, vous pouvez contacter notre équipe à
          <a href="mailto:${ADMIN_EMAIL}" style="color:#EFC031;text-decoration:none;">${ADMIN_EMAIL}</a>
          en indiquant votre signalement.
        </p>
      </div>` : ''}

      <p style="color:rgba(255,255,255,0.3);font-size:13px;line-height:1.6;margin:0;">
        Merci de contribuer à la qualité de BurkinaVista.
      </p>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#EFC031,#C9A025);color:#000;text-decoration:none;padding:11px 28px;border-radius:10px;font-weight:bold;font-size:14px;">
        Retour sur BurkinaVista
      </a>
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
    console.error('[admin/reports] Erreur envoi email résolution signalant:', err)
  }
}

// ─── GET — Liste des signalements ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const statutFilter = url.searchParams.get('statut')

    const baseQuery = `
      SELECT r.id, r.media_id, r.reason, r.message, r.reporter_email,
             r.reporter_ip::text AS reporter_ip,
             r.statut, r.admin_note, r.created_at, r.updated_at,
             m.titre AS media_titre, m.slug AS media_slug, m.type AS media_type
      FROM media_reports r
      LEFT JOIN medias m ON m.id = r.media_id
    `

    const reports = statutFilter && (ALLOWED_STATUSES as readonly string[]).includes(statutFilter)
      ? await queryMany<ReportWithMedia>(
          baseQuery + ' WHERE r.statut = $1 ORDER BY r.created_at DESC',
          [statutFilter]
        )
      : await queryMany<ReportWithMedia>(
          baseQuery + ' ORDER BY r.created_at DESC LIMIT 200',
          []
        )

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('[admin/reports GET] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH — Mise à jour statut + email résolution ────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id, statut, admin_note } = await req.json()

    if (!id || typeof id !== 'string' || !UUID_V4_REGEX.test(id)) {
      return NextResponse.json({ error: 'id invalide (UUID v4 requis)' }, { status: 400 })
    }

    if (!statut || !(ALLOWED_STATUSES as readonly string[]).includes(statut)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs : ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }
    const safeStatut = statut as ReportStatus

    // Récupérer le signalement + média pour l'email
    const existing = await queryOne<{
      id: string
      reason: string
      reporter_email: string | null
      statut: string
      media_titre: string | null
      media_slug: string | null
    }>(
      `SELECT r.id, r.reason, r.reporter_email, r.statut,
              m.titre AS media_titre, m.slug AS media_slug
       FROM media_reports r
       LEFT JOIN medias m ON m.id = r.media_id
       WHERE r.id = $1`,
      [id]
    )

    if (!existing) {
      return NextResponse.json({ error: 'Signalement introuvable' }, { status: 404 })
    }

    const safeAdminNote = admin_note ? String(admin_note).substring(0, 1000) : null

    await query(
      `UPDATE media_reports
       SET statut = $1, admin_note = $2, updated_at = NOW()
       WHERE id = $3`,
      [safeStatut, safeAdminNote, id]
    )

    // Email au signalant si :
    // - statut est 'resolved' ou 'actioned'
    // - ET le signalant a laissé son email
    if (NOTIFY_STATUSES.includes(safeStatut) && existing.reporter_email) {
      sendResolutionToReporter({
        reporterEmail: existing.reporter_email,
        mediaTitre: existing.media_titre || 'ce média',
        reason: existing.reason,
        statut: safeStatut,
        adminNote: safeAdminNote,
      }).catch((err) => console.error('[admin/reports] Email résolution échoué:', err))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/reports PATCH] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
