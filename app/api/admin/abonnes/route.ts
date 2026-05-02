/**
 * app/api/admin/abonnes/route.ts — API admin pour les abonnés newsletter
 * GET : liste des abonnés
 * PATCH : activer/désactiver un abonné
 *
 * AUDIT 2026-05-01 — CORRECTIONS APPLIQUÉES :
 *  [ABO-01] PATCH ne validait pas le format d'id et ne vérifiait pas l'existence
 *           de l'abonné — on pouvait envoyer n'importe quoi sans erreur claire.
 *           → Validation UUID v4 stricte.
 *           → Vérification d'existence avant UPDATE (404 sinon).
 *           → Validation du booléen 'actif'.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryMany, queryOne } from '@/lib/db'
import { UUID_V4_REGEX } from '@/lib/security'
import type { Abonne } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

// GET — Liste des abonnés
export async function GET(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const abonnes = await queryMany<Abonne>(
      'SELECT * FROM abonnes ORDER BY created_at DESC'
    )
    return NextResponse.json({ abonnes })
  } catch (error) {
    console.error('Erreur GET abonnés:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — Activer/désactiver un abonné
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id, actif } = await req.json()

    // [ABO-01] Validation stricte de l'id (UUID v4)
    if (!id || typeof id !== 'string' || !UUID_V4_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'id invalide (UUID v4 requis)' },
        { status: 400 }
      )
    }

    // [ABO-01] Validation du type booléen
    if (typeof actif !== 'boolean') {
      return NextResponse.json(
        { error: "actif doit être un booléen (true/false)" },
        { status: 400 }
      )
    }

    // [ABO-01] Vérification d'existence avant UPDATE
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM abonnes WHERE id = $1',
      [id]
    )
    if (!existing) {
      return NextResponse.json(
        { error: 'Abonné introuvable' },
        { status: 404 }
      )
    }

    await query(
      'UPDATE abonnes SET actif = $1, unsubscribed_at = $2 WHERE id = $3',
      [actif, actif ? null : new Date(), id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur PATCH abonné:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
