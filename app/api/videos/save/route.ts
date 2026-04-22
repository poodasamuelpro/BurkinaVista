/**
 * app/api/videos/save/route.ts
 * Sauvegarde les métadonnées d'une vidéo dans Neon après upload Backblaze B2
 *
 * CORRECTIONS APPLIQUÉES :
 *  [BUG-23] Doublon de code upsertContributeur identique à upload/route.ts
 *           → Centralisé ici (sera extrait dans lib/contributeur.ts idéalement)
 *  [BUG-24] pingGoogle() dupliquée dans save/route.ts et upload/route.ts
 *           → Gardée ici pour compatibilité (idéalement dans lib/ping.ts)
 *  [BUG-25] Headers CORS manquants sur cette route
 *           → Ajout handleOptions() + corsHeaders
 *  [BUG-26] tags non nettoyés en longueur max par tag
 *           → Ajout .substring(0, 50) sur chaque tag
 *  [BUG-27] generateSEOFromText retourne titre_en identique à titre_fr 
 *           même quand pas de traduction — bug mineur signalé
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateSEOFromText } from '@/lib/ai-seo'
import { query, queryOne } from '@/lib/db'
import { sendContributorConfirmation, sendAdminNotification } from '@/lib/email'
import type { Media, LicenceType } from '@/types'

export const dynamic = 'force-dynamic'

// [FIX BUG-25] — Origines CORS autorisées
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

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) })
}

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
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)

  try {
    const body = await req.json()

    const { b2Url, b2Key } = body
    const contributeurPrenom = (body.contributeurPrenom as string)?.trim()
    const contributeurNom = (body.contributeurNom as string)?.trim()
    const contributeurEmail = (body.contributeurEmail as string)?.trim().toLowerCase()
    const contributeurTel = (body.contributeurTel as string)?.trim() || null
    const titre = ((body.titre as string)?.trim() || '').substring(0, 200)
    const description = ((body.description as string)?.trim() || '').substring(0, 2000)
    const ville = ((body.ville as string)?.trim() || '').substring(0, 100)
    const region = ((body.region as string)?.trim() || '').substring(0, 100)
    const categorie = (body.categorie as string)?.trim()
    const licence = ((body.licence as string) || 'CC BY') as LicenceType
    const tagsRaw = (body.tags as string)?.trim() || ''
    const duration = body.duration ? Number(body.duration) : null

    // ── Validations ──────────────────────────────────────────

    if (!b2Url || typeof b2Url !== 'string' || !b2Url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'b2Url invalide (doit commencer par https://)' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!b2Key || typeof b2Key !== 'string' || !b2Key.startsWith('videos/')) {
      return NextResponse.json(
        { error: 'b2Key invalide (doit commencer par videos/)' },
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

    if (duration !== null && (isNaN(duration) || duration < 0 || duration > 86400)) {
      return NextResponse.json(
        { error: 'Durée vidéo invalide (max 86400 secondes)' },
        { status: 400, headers: corsHeaders }
      )
    }

    // [FIX BUG-26] Tags nettoyés avec longueur max par tag
    const tags = tagsRaw
      ? tagsRaw
          .split(',')
          .map((t: string) => t.trim().substring(0, 50))
          .filter(Boolean)
          .slice(0, 20)
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
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500, headers: corsHeaders }
      )
    }

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
    ]).catch((err) => console.error('[save-video] Erreur envoi emails:', err))

    pingGoogle().catch(() => {})

    return NextResponse.json({ success: true, media }, { headers: corsHeaders })

  } catch (error) {
    console.error('[save-video] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la sauvegarde de la vidéo' },
      { status: 500, headers: corsHeaders }
    )
  }
}

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
    console.error('[save-video] Erreur upsert contributeur:', error)
  }
}

async function pingGoogle(): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return
  await fetch(`https://www.google.com/ping?sitemap=${appUrl}/sitemap.xml`)
}