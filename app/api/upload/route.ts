/**
 * app/api/upload/route.ts — Upload de médias (photos uniquement)
 * Photos → Cloudinary → SEO Gemini → Neon
 * Vidéos → redirigées vers /api/videos/upload-url puis /api/videos/save
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - Validation email contributeur avec regex
 *  - Validation type MIME image stricte (pas seulement le champ type du formulaire)
 *  - Limite taille fichier photo côté serveur (20MB max)
 *  - Validation licence parmi valeurs autorisées
 *  - Validation catégorie parmi valeurs autorisées
 *  - Tags limités à 20 max, longueur par tag limitée à 50 chars
 *  - Textes titre/description limités en longueur
 *  - Ajout try/catch sur le ping Google (était implicite)
 *  - maxDuration = 60 confirmé (cohérent avec Vercel Pro)
 */
import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { generateSEOFromImage } from '@/lib/ai-seo'
import { query, queryOne } from '@/lib/db'
import { sendContributorConfirmation, sendAdminNotification } from '@/lib/email'
import type { Media, LicenceType } from '@/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
]
const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

const ALLOWED_CATEGORIES = [
  'Architecture & Urbanisme', 'Marchés & Commerce', 'Culture & Traditions',
  'Nature & Paysages', 'Gastronomie', 'Art & Artisanat', 'Sport',
  'Portraits', 'Événements & Festivals', 'Infrastructure & Développement',
]

const ALLOWED_LICENCES: LicenceType[] = ['CC BY', 'CC0', 'CC BY-NC', 'CC BY-SA']

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    // Données contributeur (obligatoires)
    const contributeurPrenom = (formData.get('contributeur_prenom') as string)?.trim()
    const contributeurNom = (formData.get('contributeur_nom') as string)?.trim()
    const contributeurEmail = (formData.get('contributeur_email') as string)?.trim().toLowerCase()
    const contributeurTel = (formData.get('contributeur_tel') as string)?.trim() || null

    // Données média
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const titre = ((formData.get('titre') as string)?.trim() || '').substring(0, 200)
    const description = ((formData.get('description') as string)?.trim() || '').substring(0, 2000)
    const ville = ((formData.get('ville') as string)?.trim() || '').substring(0, 100)
    const region = ((formData.get('region') as string)?.trim() || '').substring(0, 100)
    const categorie = (formData.get('categorie') as string)?.trim()
    const licence = ((formData.get('licence') as string) || 'CC BY') as LicenceType
    const tagsRaw = (formData.get('tags') as string)?.trim() || ''

    // Guard vidéo — les vidéos ne passent pas par cette route
    if (type === 'video' || file?.type?.startsWith('video/')) {
      return NextResponse.json(
        {
          error:
            'Les vidéos ne passent pas par cette route. Utilisez /api/videos/upload-url puis /api/videos/save.',
        },
        { status: 400 }
      )
    }

    // ── Validations ──────────────────────────────────────────

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    // Validation type MIME image
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Validation taille côté serveur
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 20 Mo.' }, { status: 400 })
    }

    if (!categorie || !ALLOWED_CATEGORIES.includes(categorie)) {
      return NextResponse.json(
        { error: `Catégorie invalide. Valeurs acceptées : ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!ALLOWED_LICENCES.includes(licence)) {
      return NextResponse.json({ error: 'Licence invalide' }, { status: 400 })
    }

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

    const tags = tagsRaw
      ? tagsRaw
          .split(',')
          .map((t: string) => t.trim().substring(0, 50))
          .filter(Boolean)
          .slice(0, 20)
      : []

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ── UPLOAD PHOTO (Cloudinary) ─────────────────────────────
    const cloudinaryResult = await uploadToCloudinary(buffer, 'burkinavista/photos')

    const userInput = {
      titre,
      description,
      ville,
      region,
      categorie,
      licence,
      tags,
    }
    const seoData = await generateSEOFromImage(cloudinaryResult.url, userInput)

    // Insérer dans Neon
    const [inserted] = await query<Media>(
      `INSERT INTO medias (
        type, cloudinary_url, cloudinary_public_id, width, height,
        slug, titre, titre_en, description, description_en,
        alt_text, alt_text_en, tags, categorie,
        ville, region, contributeur_nom, contributeur_prenom,
        contributeur_email, contributeur_tel, licence, statut
      ) VALUES (
        'photo', $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending'
      ) RETURNING *`,
      [
        cloudinaryResult.url,
        cloudinaryResult.public_id,
        cloudinaryResult.width,
        cloudinaryResult.height,
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
    ]).catch((err) => console.error('[upload] Erreur envoi emails:', err))

    // Ping Google Sitemap (non bloquant)
    pingGoogle().catch(() => {})

    return NextResponse.json({ success: true, media })

  } catch (error) {
    console.error('[upload] Erreur:', error)
    return NextResponse.json({ error: "Erreur serveur lors de l'upload" }, { status: 500 })
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
    console.error('[upload] Erreur upsert contributeur:', error)
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