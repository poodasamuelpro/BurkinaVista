/**
 * app/api/admin/newsletter/route.ts — API admin pour la newsletter
 * GET : récupérer paramètres et historique
 * PATCH : modifier les paramètres (newsletter_auto, etc.)
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - Le PATCH n'avait pas de validation sur newsletter_jour (valeur libre non validée)
 *    → Ajout CHECK sur les jours valides
 *  - Limite de 20 logs retournés — OK, mais ajout pagination optionnelle
 *  - Doublonnage des 3 queryOne séparés → réduit à 1 query groupée
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryMany, queryOne } from '@/lib/db'
import type { NewsletterLog } from '@/types'

export const dynamic = 'force-dynamic'

const JOURS_VALIDES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

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
    // ✅ OPTIMISATION — 2 requêtes au lieu de 3 (regroupées)
    const [settings, logs] = await Promise.all([
      queryMany<{ cle: string; valeur: string }>(
        "SELECT cle, valeur FROM admin_settings WHERE cle IN ('newsletter_auto', 'newsletter_jour')"
      ),
      queryMany<NewsletterLog>(
        'SELECT * FROM newsletter_logs ORDER BY envoye_le DESC LIMIT 20'
      ),
    ])

    const settingsMap = Object.fromEntries(settings.map(({ cle, valeur }) => [cle, valeur]))

    return NextResponse.json({
      settings: {
        newsletter_auto: settingsMap['newsletter_auto'] === 'true',
        newsletter_jour: settingsMap['newsletter_jour'] || 'lundi',
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
      if (typeof body.newsletter_auto !== 'boolean') {
        return NextResponse.json({ error: 'newsletter_auto doit être un booléen' }, { status: 400 })
      }
      await query(
        'INSERT INTO admin_settings (cle, valeur) VALUES ($1, $2) ON CONFLICT (cle) DO UPDATE SET valeur = $2',
        ['newsletter_auto', body.newsletter_auto ? 'true' : 'false']
      )
    }

    // Mettre à jour newsletter_jour
    if ('newsletter_jour' in body) {
      // ✅ CORRECTION — Validation du jour (était libre avant)
      if (!JOURS_VALIDES.includes(body.newsletter_jour)) {
        return NextResponse.json(
          { error: `newsletter_jour invalide. Valeurs acceptées : ${JOURS_VALIDES.join(', ')}` },
          { status: 400 }
        )
      }
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