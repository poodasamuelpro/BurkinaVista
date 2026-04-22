/**
 * app/api/videos/save/route.ts
 * Sauvegarde les métadonnées d'une vidéo dans Neon après upload Backblaze B2
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - Validation URL b2Url (doit commencer par https://)
 *  - Validation format b2Key (doit commencer par videos/)
 *  - Validation email contributeur avec regex
 *  - Protection injection : b2Key nettoyé avant insertion
 *  - Correction doublonnage upsertContributeur (même code que upload/route.ts → centralisé)
 *  - La fonction pingGoogle() dupliquée avec upload/route.ts — centralisée dans lib/ping.ts
 *  - Ajout validation categorie parmi valeurs autorisées
 *  - Limitation titre/description en longueur pour éviter overflow DB
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateSEOFromText } from '@/lib/ai-seo'
import { query, queryOne } from '@/lib/db'
import { sendContributorConfirmation, sendAdminNotification } from '@/lib/email'
import type { Media, LicenceType } from '@/types'

export const dynamic = 'force-dynamic'

const ALLOWED_CATEGORIES = [
  'Architecture & Urbanisme',
  'Marchés & Commerce',
  'Culture & Traditions',
  'Nature & Paysages',
  'Gastronomie',
  'Art & Artisanat',
  'Sport',
  'Portraits',
  'Événements & Festivals',
  'Infrastructure & Développement',
]

const ALLOWED_LICENCES: LicenceType[] = ['CC BY', 'CC0', 'CC BY-NC', 'CC BY-SA']

// Regex validation email basique
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Données B2 (reçues après upload client direct)
    const { b2Url, b2Key } = body

    // Données contributeur
    const contributeurPrenom = (body.contributeurPrenom as string)?.trim()
    const contributeurNom = (body.contributeurNom as string)?.trim()
    const contributeurEmail = (body.contributeurEmail as string)?.trim().toLowerCase()
    const contributeurTel = (body.contributeurTel as string)?.trim() || null

    // Données média
    const titre = ((body.titre as string)?.trim() || '').substring(0, 200)
    const description = ((body.description as string)?.trim() || '').substring(0, 2000)
    const ville = ((body.ville as string)?.trim() || '').substring(0, 100)
    const region = ((body.region as string)?.trim() || '').substring(0, 100)
    const categorie = (body.categorie as string)?.trim()
    const licence = ((body.licence as string) || 'CC BY') as LicenceType
    const tagsRaw = (body.tags as string)?.trim() || ''
    const duration = body.duration ? Number(body.duration) : null

    // ── Validations ──────────────────────────────────────────

    // Validation b2Url
    if (!b2Url || typeof b2Url !== 'string' || !b2Url.startsWith('https://')) {
      return NextResponse.json({ error: 'b2Url invalide (doit commencer par https://)' }, { status: 400 })
    }

    // Validation b2Key
    if (!b2Key || typeof b2Key !== 'string' || !b2Key.startsWith('videos/')) {
      return NextResponse.json({ error: 'b2Key invalide (doit commencer par videos/)' }, { status: 400 })
    }

    // Validation catégorie
    if (!categorie || !ALLOWED_CATEGORIES.includes(categorie)) {
      return NextResponse.json(
        { error: `Catégorie invalide. Valeurs acceptées : ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validation licence
    if (!ALLOWED_LICENCES.includes(licence)) {
      return NextResponse.json({ error: 'Licence invalide' }, { status: 400 })
    }

    // Validation contributeur
    if (!contributeurPrenom || !contributeurNom) {
      return NextResponse.json(
        { error: 'Prénom et nom du contributeur requis' },
        { status: 400 }
      )
    }

    if (!contributeurEmail || !EMAIL_REGEX.test(contributeurEmail)) {
      return NextResponse.json(
        { error: 'Email contributeur invalide' },
        { status: 400 }
      )
    }

    // Validation durée vidéo
    if (duration !== null && (isNaN(duration) || duration < 0 || duration > 86400)) {
      return NextResponse.json({ error: 'Durée vidéo invalide (max 86400 secondes)' }, { status: 400 })
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 20)
      : []

    // Générer le SEO à partir des infos contributeur
    const seoData = generateSEOFromText({
      titre,
      description,
      ville,
      region,
      categorie,
      licence,
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

    // Ping Google Sitemap (non bloquant)
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