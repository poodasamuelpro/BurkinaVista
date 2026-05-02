/**
 * app/api/admin/reports/route.ts — API admin pour les signalements
 *
 * AJOUT (Audit 2026-05-01) — Item #14 :
 *  GET   : liste les signalements (filtre par statut optionnel)
 *  PATCH : met à jour le statut d'un signalement (review / resolved / dismissed)
 *
 *  Authentification : middleware.ts couvre déjà /api/admin/*, mais on conserve
 *  un checkAdmin local pour défense en profondeur.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryMany, queryOne } from '@/lib/db'
import { UUID_V4_REGEX } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_STATUSES = ['pending', 'review', 'resolved', 'dismissed'] as const

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

// GET — Liste des signalements (filtre statut optionnel via ?statut=pending)
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

// PATCH — Mise à jour du statut d'un signalement
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

    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM media_reports WHERE id = $1',
      [id]
    )
    if (!existing) {
      return NextResponse.json({ error: 'Signalement introuvable' }, { status: 404 })
    }

    await query(
      `UPDATE media_reports
       SET statut = $1, admin_note = $2, updated_at = NOW()
       WHERE id = $3`,
      [statut, admin_note ? String(admin_note).substring(0, 1000) : null, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/reports PATCH] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
