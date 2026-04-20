/**
 * app/api/admin/abonnes/route.ts — API admin pour les abonnés newsletter
 * GET : liste des abonnés
 * PATCH : activer/désactiver un abonné
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryMany } from '@/lib/db'
import type { Abonne } from '@/types'

export const dynamic = 'force-dynamic'

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
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    await query(
      'UPDATE abonnes SET actif = $1 WHERE id = $2',
      [actif, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur PATCH abonné:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
