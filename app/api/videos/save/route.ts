/**
 * app/api/videos/save/route.ts
 * Sauvegarde les métadonnées d'une vidéo dans Neon après upload Backblaze B2
 * Génère le SEO à partir des infos contributeur (pas d'analyse IA de la vidéo)
 * Envoie les emails de confirmation
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateSEOFromText } from '@/lib/ai-seo'
import { query, queryOne } from '@/lib/db'
import { sendContributorConfirmation, sendAdminNotification } from '@/lib/email'
import type { Media, LicenceType } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Données B2 (reçues après upload client direct)
    const { b2Url, b2Key } = body

    // Données contributeur
    const contributeurPrenom = (body.contributeurPrenom as string)?.trim()
    const contributeurNom = (body.contributeurNom as string)?.trim()
    const contributeurEmail = (body.contributeurEmail as string)?.trim()
    const contributeurTel = (body.contributeurTel as string)?.trim() || null

    // Données média
    const titre = (body.titre as string)?.trim() || ''
    const description = (body.description as string)?.trim() || ''
    const ville = (body.ville as string)?.trim() || ''
    const region = (body.region as string)?.trim() || ''
    const categorie = (body.categorie as string)?.trim()
    const licence = (body.licence as string) || 'CC BY'
    const tagsRaw = (body.tags as string)?.trim() || ''
    const duration = body.duration ? Number(body.duration) : null

    // Validations
    if (!b2Url || !b2Key) {
      return NextResponse.json({ error: 'b2Url et b2Key requis' }, { status: 400 })
    }
    if (!categorie) {
      return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 })
    }
    if (!contributeurPrenom || !contributeurNom || !contributeurEmail) {
      return NextResponse.json(
        { error: 'Prénom, nom et email du contributeur requis' },
        { status: 400 }
      )
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
      : []

    // Générer le SEO à partir des infos contributeur (pas d'analyse IA vidéo)
    const seoData = generateSEOFromText({
      titre,
      description,
      ville,
      region,
      categorie,
      licence: licence as LicenceType,
      tags,
    })

    // Insérer dans Neon
    const [inserted] = await query<Media>(
      `INSERT INTO medias (
        type, b2_url, b2_key, thumbnail_url, duration,
        slug, titre, titre_en, description, description_en,
        alt_text, alt_text_en, tags, categorie,
        ville, region, contributeur_nom, contributeur_prenom,
        contributeur_email, contributeur_tel, licence, statut
      ) VALUES (
        'video', $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending'
      ) RETURNING *`,
      [
        b2Url,
        b2Key,
        null, // thumbnail_url — pas de thumbnail automatique pour l'instant
        duration,
        seoData.slug,
        seoData.titre,
        seoData.titre_en,
        seoData.description,
        seoData.description_en,
        seoData.alt_text,
        seoData.alt_text_en,
        seoData.tags,
        categorie,
        ville || null,
        region || null,
        contributeurNom,
        contributeurPrenom,
        contributeurEmail,
        contributeurTel,
        licence,
      ]
    )

    const media: Media | null = inserted ?? null

    if (!media) {
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
    }

    // Sauvegarder/mettre à jour le contributeur
    await upsertContributeur(contributeurPrenom, contributeurNom, contributeurEmail, contributeurTel)

    // Envoi emails en parallèle (non bloquant)
    const emailMedia: Media = {
      ...media,
      contributeur_prenom: contributeurPrenom,
      contributeur_nom: contributeurNom,
      contributeur_email: contributeurEmail,
      contributeur_tel: contributeurTel || undefined,
    }

    Promise.all([
      sendContributorConfirmation(contributeurEmail, contributeurPrenom, media.titre),
      sendAdminNotification(emailMedia),
    ]).catch((err) => console.error('[save-video] Erreur envoi emails:', err))

    // Ping Google Sitemap
    pingGoogle().catch(() => {})

    return NextResponse.json({ success: true, media })

  } catch (error) {
    console.error('[save-video] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la sauvegarde de la vidéo' },
      { status: 500 }
    )
  }
}

/**
 * Crée ou met à jour le contributeur dans la base de données
 */
async function upsertContributeur(
  prenom: string,
  nom: string,
  email: string,
  tel: string | null
): Promise<void> {
  try {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM contributeurs WHERE email = $1',
      [email]
    )

    if (existing) {
      await query(
        'UPDATE contributeurs SET medias_count = medias_count + 1 WHERE email = $1',
        [email]
      )
    } else {
      await query(
        'INSERT INTO contributeurs (prenom, nom, email, tel, medias_count) VALUES ($1, $2, $3, $4, 1)',
        [prenom, nom, email, tel]
      )
    }
  } catch (error) {
    console.error('[save-video] Erreur upsert contributeur:', error)
  }
}

/**
 * Ping Google pour indexer le nouveau sitemap
 */
async function pingGoogle(): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return
  await fetch(`https://www.google.com/ping?sitemap=${appUrl}/sitemap.xml`)
}
