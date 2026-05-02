/**
 * app/api/upload/route.ts — Upload de médias (photos uniquement)
 * Photos → Cloudinary → SEO Gemini → Neon
 *
 * CORRECTIONS APPLIQUÉES :
 *  [BUG-28] Headers CORS manquants → OPTIONS + getCorsHeaders()
 *  [BUG-29] upsertContributeur ne mettait pas à jour last_contribution_at
 *  [BUG-30] try/catch autour de Gemini (déjà géré dans ai-seo.ts via fallback)
 *  [BUG-31] slug : suffixe timestamp pour éviter collision UNIQUE
 *
 * AUDIT 2026-05-01 — NOUVELLES CORRECTIONS :
 *  [UP-01] Rate-limiting par IP (10 uploads / 10 min) — RATE_LIMITS.UPLOAD_PHOTO
 *  [UP-02] Captcha Cloudflare Turnstile (header X-Turnstile-Token ou champ form
 *          turnstileToken). Skip silencieux si non configuré.
 *  [UP-03] Vérification magic bytes — un fichier renommé .jpg mais qui n'est pas
 *          une vraie image sera rejeté avant upload Cloudinary.
 *  [UP-04] Suppression des métadonnées EXIF (géolocalisation, appareil) via sharp
 *          AVANT upload Cloudinary, pour protéger la vie privée du contributeur.
 *  [UP-05] Scan antivirus best-effort via VirusTotal (timeout 3s, non bloquant
 *          en cas d'erreur, blocage uniquement si ≥3 moteurs détectent un malware).
 *
 * FIX 2026-05-02 :
 *  [UP-06] Buffer.from(arrayBuffer as ArrayBuffer) — résout l'erreur TypeScript
 *          "Type 'Buffer<ArrayBufferLike>' is not assignable to type 'Buffer<ArrayBuffer>'"
 *          car file.arrayBuffer() retourne Promise<ArrayBuffer | SharedArrayBuffer>
 *          mais en pratique ne retourne jamais un SharedArrayBuffer côté File API.
 */
import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { generateSEOFromImage } from '@/lib/ai-seo'
import { query, queryOne } from '@/lib/db'
import { sendContributorConfirmation, sendAdminNotification } from '@/lib/email'
import { rateLimitByIp, RATE_LIMITS, rateLimitHeaders, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { verifyMagicBytes, stripExifFromImage } from '@/lib/security'
import { scanBufferQuick } from '@/lib/virustotal'
import type { Media, LicenceType } from '@/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Turnstile-Token',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)

  // [UP-01] Rate-limiting par IP
  const rl = await rateLimitByIp(req, RATE_LIMITS.UPLOAD_PHOTO)
  const baseHeaders = { ...corsHeaders, ...rateLimitHeaders(rl) }
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop d\'uploads. Merci de patienter quelques minutes avant de réessayer.' },
      { status: 429, headers: baseHeaders }
    )
  }

  try {
    const formData = await req.formData()

    // [UP-02] Captcha Turnstile (header ou champ form)
    const headerToken = req.headers.get('x-turnstile-token')
    const turnstileToken = headerToken || (formData.get('turnstileToken') as string | null)
    const captchaOk = await verifyTurnstile(turnstileToken, getClientIp(req))
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Vérification anti-spam échouée. Veuillez recharger la page et réessayer.' },
        { status: 400, headers: baseHeaders }
      )
    }

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

    if (type === 'video' || file?.type?.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Les vidéos ne passent pas par cette route. Utilisez /api/videos/upload-url puis /api/videos/save.' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400, headers: baseHeaders })
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, GIF' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 20 Mo.' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (!categorie || !ALLOWED_CATEGORIES.includes(categorie)) {
      return NextResponse.json(
        { error: `Catégorie invalide. Valeurs acceptées : ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400, headers: baseHeaders }
      )
    }

    if (!ALLOWED_LICENCES.includes(licence)) {
      return NextResponse.json(
        { error: 'Licence invalide' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (!contributeurPrenom || !contributeurNom) {
      return NextResponse.json(
        { error: 'Prénom et nom du contributeur requis' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (!contributeurEmail || !EMAIL_REGEX.test(contributeurEmail)) {
      return NextResponse.json(
        { error: 'Email contributeur invalide' },
        { status: 400, headers: baseHeaders }
      )
    }

    const tags = tagsRaw
      ? tagsRaw
          .split(',')
          .map((t: string) => t.trim().substring(0, 50))
          .filter(Boolean)
          .slice(0, 20)
      : []

    // [UP-06] Cast explicite en ArrayBuffer pour satisfaire TypeScript strict.
    // file.arrayBuffer() retourne ArrayBuffer | SharedArrayBuffer (ArrayBufferLike)
    // mais la File API Web ne produit jamais un SharedArrayBuffer ici.
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer as ArrayBuffer)

    // [UP-03] Vérification magic bytes
    if (!verifyMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "Le contenu du fichier ne correspond pas au format déclaré. Fichier potentiellement corrompu ou suspect." },
        { status: 400, headers: baseHeaders }
      )
    }

    // [UP-05] Scan antivirus best-effort (non bloquant en cas d'erreur)
    const scan = await scanBufferQuick(buffer)
    if (!scan.safe) {
      console.warn('[upload] Fichier détecté comme malicieux par VirusTotal:', scan.detections)
      return NextResponse.json(
        { error: "Ce fichier a été identifié comme potentiellement malicieux et a été rejeté." },
        { status: 400, headers: baseHeaders }
      )
    }

    // [UP-04] Suppression des métadonnées EXIF (vie privée)
    // Skip pour les GIF (sharp ne gère pas le GIF animé proprement)
    if (file.type !== 'image/gif') {
      try {
        buffer = await stripExifFromImage(buffer, file.type)
      } catch (err) {
        console.warn('[upload] stripExif a échoué, on continue avec l\'original:', err)
      }
    }

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
        { status: 500, headers: baseHeaders }
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
    ]).catch((err) => console.error('[upload] Erreur envoi emails:', err))

    pingGoogle().catch(() => {})

    return NextResponse.json({ success: true, media }, { headers: baseHeaders })
  } catch (error) {
    console.error('[upload] Erreur:', error)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload" },
      { status: 500, headers: baseHeaders }
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
    console.error('[upload] Erreur upsert contributeur:', error)
  }
}

async function pingGoogle(): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return
  await fetch(`https://www.google.com/ping?sitemap=${appUrl}/sitemap.xml`)
}
