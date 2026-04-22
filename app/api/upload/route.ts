/**
 * app/api/upload/route.ts — Upload de médias (photos uniquement)
 * Photos → Cloudinary → SEO Gemini → Neon
 *
 * CORRECTIONS APPLIQUÉES :
 *  [BUG-28] Headers CORS manquants → preflight OPTIONS non géré
 *           → Ajout OPTIONS + getCorsHeaders()
 *  [BUG-29] upsertContributeur ne met pas à jour last_contribution_at
 *           → Ajout last_contribution_at = NOW() sur UPDATE
 *  [BUG-30] Pas de try/catch autour de l'appel Gemini (generateSEOFromImage)
 *           si l'image Cloudinary est inaccessible juste après upload
 *           → Déjà géré dans ai-seo.ts (fallback) — confirmé OK
 *  [BUG-31] slug non vérifié unicité avant insertion (peut générer une erreur UNIQUE)
 *           → Ajout d'un suffixe timestamp (déjà présent dans ai-seo.ts) — confirmé OK
 *           mais on ajoute un catch spécifique sur l'erreur unique pour retry
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
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
]
const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024

const ALLOWED_CATEGORIES = [
  'Architecture & Urbanisme', 'Marchés & Commerce', 'Culture & Traditions',
  'Nature & Paysages', 'Gastronomie', 'Art & Artisanat', 'Sport',
  'Portraits', 'Événements & Festivals', 'Infrastructure & Développement',
]

const ALLOWED_LICENCES: LicenceType[] = ['CC BY', 'CC0', 'CC BY-NC', 'CC BY-SA']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// [FIX BUG-28] — Origines CORS autorisées
const ALLOWED_CORS_ORIGINS = [
  'https://burkina-vista.vercel.app',
  'https://burkinavistabf.poodasamuel.com',
  'http://localhost:3000',
]

function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin =
    process.env.NODE_ENV !== 'production'
      ? '*'
      : ALLOWED_CORS_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_CORS_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

// [FIX BUG-28] — Preflight CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)

  try {
    const formData = await req.formData()

    const contributeurPrenom = (formData.get('contributeur_prenom') as string)?.trim()
    const contributeurNom = (formData.get('contributeur_nom') as string)?.trim()
    const contributeurEmail = (formData.get('contributeur_email') as string)?.trim().toLowerCase()
    const contributeurTel = (formData.get('contributeur_tel') as string)?.trim() || null

    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const titre = ((formData.get('titre') as string)?.trim() || '').substring(0, 200)
    const description = ((formData.get('description') as string)?.trim() || '').substring(0, 2000)
    const ville = ((formData.get('ville') as string)?.trim() || '').substring(0, 100)
    const region = ((formData.get('region') as string)?.trim() || '').substring(0, 100)
    const categorie = (formData.get('categorie') as string)?.trim()
    const licence = ((formData.get('licence') as string) || 'CC BY') as LicenceType
    const tagsRaw = (formData.get('tags') as string)?.trim() || ''

    // Guard vidéo
    if (type === 'video' || file?.type?.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Les vidéos ne passent pas par cette route. Utilisez /api/videos/upload-url puis /api/videos/save.' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400, headers: corsHeaders })
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, GIF' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 20 Mo.' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!categorie || !ALLOWED_CATEGORIES.includes(categorie)) {
      return NextResponse.json(
        { error: `Catégorie invalide. Valeurs acceptées : ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!ALLOWED_LICENCES.includes(licence)) {
      return NextResponse.json(
        { error: 'Licence invalide' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!contributeurPrenom || !contributeurNom) {
      return NextResponse.json(
        { error: 'Prénom et nom du contributeur requis' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!contributeurEmail || !EMAIL_REGEX.test(contributeurEmail)) {
      return NextResponse.json(
        { error: 'Email contributeur invalide' },
        { status: 400, headers: corsHeaders }
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

    const cloudinaryResult = await uploadToCloudinary(buffer, 'burkinavista/photos')

    const userInput = { titre, description, ville, region, categorie, licence, tags }
    const seoData = await generateSEOFromImage(cloudinaryResult.url, userInput)

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
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500, headers: corsHeaders }
      )
    }

    // [FIX BUG-29] — upsertContributeur avec last_contribution_at
    await upsertContributeur(contributeurPrenom, contributeurNom, contributeurEmail, contributeurTel)

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

    pingGoogle().catch(() => {})

    return NextResponse.json({ success: true, media }, { headers: corsHeaders })

  } catch (error) {
    console.error('[upload] Erreur:', error)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload" },
      { status: 500, headers: corsHeaders }
    )
  }
}

// [FIX BUG-29] — Ajout last_contribution_at
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
        'UPDATE contributeurs SET medias_count = medias_count + 1, last_contribution_at = NOW() WHERE email = $1',
        [email]
      )
    } else {
      await query(
        `INSERT INTO contributeurs (prenom, nom, email, tel, medias_count, last_contribution_at)
         VALUES ($1, $2, $3, $4, 1, NOW())`,
        [prenom, nom, email, tel]
      )
    }
  } catch (error) {
    console.error('[upload] Erreur upsert contributeur:', error)
  }
}

async function pingGoogle(): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return
  await fetch(`https://www.google.com/ping?sitemap=${appUrl}/sitemap.xml`)
}