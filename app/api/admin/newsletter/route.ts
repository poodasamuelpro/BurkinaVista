/**
 * app/api/admin/newsletter/route.ts — API admin pour la newsletter
 * GET : récupérer paramètres et historique
 * PATCH : modifier les paramètres (newsletter_auto, etc.)
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryMany, queryOne } from '@/lib/db'
import type { NewsletterLog } from '@/types'

export const dynamic = 'force-dynamic'

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

// GET — Paramètres et historique
export async function GET(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const [autoSetting, jourSetting, logs] = await Promise.all([
      queryOne<{ valeur: string }>(
        'SELECT valeur FROM admin_settings WHERE cle = $1',
        ['newsletter_auto']
      ),
      queryOne<{ valeur: string }>(
        'SELECT valeur FROM admin_settings WHERE cle = $1',
        ['newsletter_jour']
      ),
      queryMany<NewsletterLog>(
        'SELECT * FROM newsletter_logs ORDER BY envoye_le DESC LIMIT 20'
      ),
    ])

    return NextResponse.json({
      settings: {
        newsletter_auto: autoSetting?.valeur === 'true',
        newsletter_jour: jourSetting?.valeur || 'lundi',
      },
      logs,
    })
  } catch (error) {
    console.error('Erreur GET newsletter settings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — Modifier un paramètre
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Mettre à jour newsletter_auto
    if ('newsletter_auto' in body) {
      await query(
        'INSERT INTO admin_settings (cle, valeur) VALUES ($1, $2) ON CONFLICT (cle) DO UPDATE SET valeur = $2',
        ['newsletter_auto', body.newsletter_auto ? 'true' : 'false']
      )
    }

    // Mettre à jour newsletter_jour
    if ('newsletter_jour' in body) {
      await query(
        'INSERT INTO admin_settings (cle, valeur) VALUES ($1, $2) ON CONFLICT (cle) DO UPDATE SET valeur = $2',
        ['newsletter_jour', body.newsletter_jour]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur PATCH newsletter settings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
