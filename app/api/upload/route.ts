/**
 * app/api/upload/route.ts — Upload de médias (photos uniquement)
 * - Upload Cloudinary pour les photos
 * - Génération SEO avec Gemini
 * - Sauvegarde dans Neon
 * - Envoi emails (contributeur + admin)
 * - Sans authentification utilisateur requise
 *
 * NOTE : L'upload vidéo (Cloudflare Stream) est désactivé côté serveur.
 *        Toute tentative retourne un 503 propre sans toucher au serveur.
 */
import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { generateSEOFromImage } from '@/lib/ai-seo'
import { query, queryOne } from '@/lib/db'
import { sendContributorConfirmation, sendAdminNotification } from '@/lib/email'
import type { Media } from '@/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    // Données contributeur (obligatoires)
    const contributeurPrenom = (formData.get('contributeur_prenom') as string)?.trim()
    const contributeurNom = (formData.get('contributeur_nom') as string)?.trim()
    const contributeurEmail = (formData.get('contributeur_email') as string)?.trim()
    const contributeurTel = (formData.get('contributeur_tel') as string)?.trim() || null

    // Données média
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const titre = (formData.get('titre') as string)?.trim() || ''
    const description = (formData.get('description') as string)?.trim() || ''
    const ville = (formData.get('ville') as string)?.trim() || ''
    const region = (formData.get('region') as string)?.trim() || ''
    const categorie = (formData.get('categorie') as string)?.trim()
    const licence = (formData.get('licence') as string) || 'CC BY'
    const tagsRaw = (formData.get('tags') as string)?.trim() || ''

    // ── Refus vidéo côté serveur (guard propre, pas de 404) ──
    if (type === 'video' || file?.type?.startsWith('video/')) {
      return NextResponse.json(
        { error: "L'upload vidéo n'est pas encore disponible. Bientôt !" },
        { status: 503 }
      )
    }

    // Validations
    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }
    if (!categorie) {
      return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 })
    }
    if (!contributeurPrenom || !contributeurNom || !contributeurEmail) {
      return NextResponse.json({ error: 'Prénom, nom et email du contributeur requis' }, { status: 400 })
    }

    const tags = tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean) : []

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ────────────────────────────────
    // UPLOAD PHOTO (Cloudinary)
    // ────────────────────────────────
    const cloudinaryResult = await uploadToCloudinary(buffer, 'burkinavista/photos')

    const userInput = {
      titre, description, ville, region, categorie,
      licence: licence as 'CC BY' | 'CC0' | 'CC BY-NC' | 'CC BY-SA',
      tags,
    }
    const seoData = await generateSEOFromImage(cloudinaryResult.url, userInput)

    // Insérer dans Neon
    const [inserted] = await query<Media>(
      `INSERT INTO medias (
        type, cloudinary_url, cloudinary_public_id, width, height,
        slug, titre, description, alt_text, tags, categorie,
        ville, region, contributeur_nom, contributeur_prenom,
        contributeur_email, contributeur_tel, licence, statut
      ) VALUES (
        'photo', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, 'pending'
      ) RETURNING *`,
      [
        cloudinaryResult.url,
        cloudinaryResult.public_id,
        cloudinaryResult.width,
        cloudinaryResult.height,
        seoData.slug,
        seoData.titre,
        seoData.description,
        seoData.alt_text,
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
    const emailMedia = {
      ...media,
      contributeur_prenom: contributeurPrenom,
      contributeur_nom: contributeurNom,
      contributeur_email: contributeurEmail,
      contributeur_tel: contributeurTel || undefined,
    }
    Promise.all([
      sendContributorConfirmation(contributeurEmail, contributeurPrenom, media.titre),
      sendAdminNotification(emailMedia as Media),
    ]).catch((err) => console.error('Erreur envoi emails:', err))

    // Ping Google Sitemap
    pingGoogle().catch(() => {})

    return NextResponse.json({ success: true, media })

  } catch (error) {
    console.error('Erreur upload:', error)
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
    console.error('Erreur upsert contributeur:', error)
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
