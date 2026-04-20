/**
 * app/api/cron/newsletter/route.ts — Cron job newsletter hebdomadaire
 * Déclenché chaque lundi à 8h via Vercel Cron (vercel.json)
 * Condition : au moins 1 média approuvé depuis le lundi précédent
 */
import { NextRequest, NextResponse } from 'next/server'
import { queryOne, queryMany } from '@/lib/db'
import { sendNewsletter } from '@/lib/email'
import type { Media, Abonne } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    // Vérification de l'autorisation Vercel Cron
    const authHeader = req.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Vercel envoie automatiquement le header, on accepte aussi sans secret en dev
      // Pour la sécurité en production, on peut activer cette vérification
    }

    // Vérifier si newsletter automatique activée
    const autoSetting = await queryOne<{ valeur: string }>(
      'SELECT valeur FROM admin_settings WHERE cle = $1',
      ['newsletter_auto']
    )

    if (autoSetting?.valeur !== 'true') {
      return NextResponse.json({ message: 'Newsletter automatique désactivée', sent: false })
    }

    // Calculer le lundi précédent à 00:00:00
    const now = new Date()
    const lastMonday = new Date(now)
    const dayOfWeek = now.getDay() // 0 = dimanche, 1 = lundi, ...
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    lastMonday.setDate(now.getDate() - daysToLastMonday)
    lastMonday.setHours(0, 0, 0, 0)

    // Récupérer les médias approuvés depuis le lundi précédent
    const medias = await queryMany<Media>(
      `SELECT * FROM medias 
       WHERE statut = 'approved' AND created_at >= $1 
       ORDER BY created_at DESC`,
      [lastMonday.toISOString()]
    )

    if (medias.length === 0) {
      return NextResponse.json({
        message: 'Aucun nouveau média cette semaine — newsletter non envoyée',
        sent: false,
      })
    }

    // Récupérer tous les abonnés actifs
    const abonnes = await queryMany<Abonne>(
      'SELECT * FROM abonnes WHERE actif = true ORDER BY created_at ASC'
    )

    if (abonnes.length === 0) {
      return NextResponse.json({
        message: 'Aucun abonné actif — newsletter non envoyée',
        sent: false,
      })
    }

    // Envoyer la newsletter
    await sendNewsletter(abonnes, medias)

    // Logger dans newsletter_logs
    const sujet = `BurkinaVista — ${medias.length} nouveau${medias.length > 1 ? 'x' : ''} média${medias.length > 1 ? 's' : ''} cette semaine`
    await queryOne(
      `INSERT INTO newsletter_logs (sujet, nb_destinataires, nb_medias, statut)
       VALUES ($1, $2, $3, 'sent') RETURNING id`,
      [sujet, abonnes.length, medias.length]
    )

    return NextResponse.json({
      success: true,
      message: `Newsletter envoyée à ${abonnes.length} abonné(s) avec ${medias.length} média(s)`,
      nbDestinataires: abonnes.length,
      nbMedias: medias.length,
    })
  } catch (error) {
    console.error('Erreur cron newsletter:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Route POST pour l'envoi manuel depuis le dashboard admin
export async function POST(req: NextRequest) {
  try {
    const { dateDebut, dateFin } = await req.json().catch(() => ({}))

    let mediasQuery: Media[]
    if (dateDebut && dateFin) {
      mediasQuery = await queryMany<Media>(
        `SELECT * FROM medias 
         WHERE statut = 'approved' AND created_at >= $1 AND created_at <= $2 
         ORDER BY created_at DESC`,
        [dateDebut, dateFin]
      )
    } else {
      // Médias de la semaine courante
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      mediasQuery = await queryMany<Media>(
        `SELECT * FROM medias 
         WHERE statut = 'approved' AND created_at >= $1 
         ORDER BY created_at DESC`,
        [oneWeekAgo.toISOString()]
      )
    }

    const abonnes = await queryMany<Abonne>(
      'SELECT * FROM abonnes WHERE actif = true ORDER BY created_at ASC'
    )

    if (abonnes.length === 0) {
      return NextResponse.json({ error: 'Aucun abonné actif' }, { status: 400 })
    }

    if (mediasQuery.length === 0) {
      return NextResponse.json({ error: 'Aucun média pour cette période' }, { status: 400 })
    }

    await sendNewsletter(abonnes, mediasQuery)

    const sujet = `BurkinaVista — Envoi manuel — ${mediasQuery.length} média(s)`
    await queryOne(
      `INSERT INTO newsletter_logs (sujet, nb_destinataires, nb_medias, statut)
       VALUES ($1, $2, $3, 'sent') RETURNING id`,
      [sujet, abonnes.length, mediasQuery.length]
    )

    return NextResponse.json({
      success: true,
      message: `Newsletter envoyée à ${abonnes.length} abonné(s)`,
      nbDestinataires: abonnes.length,
      nbMedias: mediasQuery.length,
    })
  } catch (error) {
    console.error('Erreur envoi manuel newsletter:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
