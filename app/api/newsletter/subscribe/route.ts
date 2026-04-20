/**
 * app/api/newsletter/subscribe/route.ts — Abonnement newsletter
 * POST : email + nom optionnel
 * Insert dans abonnes, envoie email de bienvenue
 */
import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { sendWelcomeNewsletter } from '@/lib/email'
import type { Abonne } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, nom } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    // Vérifier si déjà inscrit
    const existing = await queryOne<Abonne>(
      'SELECT * FROM abonnes WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (existing) {
      if (existing.actif) {
        return NextResponse.json({ message: 'Vous êtes déjà abonné(e) à la newsletter !' })
      } else {
        // Réactiver l'abonnement
        await query(
          'UPDATE abonnes SET actif = true, nom = $1 WHERE email = $2',
          [nom || existing.nom, email.toLowerCase().trim()]
        )
        return NextResponse.json({ success: true, message: 'Votre abonnement a été réactivé !' })
      }
    }

    // Créer le nouvel abonné
    await query(
      'INSERT INTO abonnes (email, nom, actif) VALUES ($1, $2, true)',
      [email.toLowerCase().trim(), nom || null]
    )

    // Envoyer email de bienvenue (non bloquant)
    sendWelcomeNewsletter(email, nom).catch((err) =>
      console.error('Erreur email bienvenue:', err)
    )

    return NextResponse.json({
      success: true,
      message: 'Vous êtes maintenant abonné(e) à la newsletter BurkinaVista !',
    })
  } catch (error) {
    console.error('Erreur subscribe newsletter:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
