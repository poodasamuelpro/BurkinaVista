/**
 * app/photos/[slug]/page.tsx — Page détail d'un média
 * Metadata SEO + JSON-LD — bilingue FR/EN
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { queryOne, queryMany, query } from '@/lib/db'
import PhotoDetailClient from './PhotoDetailClient'
import type { Media } from '@/types'

interface Props {
  params: { slug: string; locale?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const media = await queryOne<Media>(
    "SELECT * FROM medias WHERE slug = $1 AND statut = 'approved'",
    [params.slug]
  )

  if (!media) return { title: 'Média introuvable — BurkinaVista' }

  const locale = params.locale ?? 'fr'
  const titre = locale === 'en' ? (media.titre_en ?? media.titre) : media.titre
  const description =
    locale === 'en' ? (media.description_en ?? media.description) : media.description

  return {
    title: `${titre} — BurkinaVista`,
    description: description || `Photo du Burkina Faso — ${media.categorie}`,
    keywords: media.tags,
    openGraph: {
      title: titre,
      description: description || '',
      // Pour les photos : cloudinary_url ; pour les vidéos : thumbnail_url ou b2_url
      images: [{ url: media.cloudinary_url || media.thumbnail_url || media.b2_url || '' }],
      type: media.type === 'video' ? 'video.other' : 'article',
      locale: locale === 'en' ? 'en_US' : 'fr_FR',
      siteName: 'BurkinaVista',
    },
    twitter: {
      card: 'summary_large_image',
      title: titre,
      description: description || '',
      images: [media.cloudinary_url || media.thumbnail_url || media.b2_url || ''],
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function PhotoDetailPage({ params }: Props) {
  const media = await queryOne<Media>(
    "SELECT * FROM medias WHERE slug = $1 AND statut = 'approved'",
    [params.slug]
  )

  if (!media) notFound()

  // Incrémenter les vues (non bloquant)
  query('UPDATE medias SET views = views + 1 WHERE id = $1', [media.id]).catch(() => {})

  // Médias similaires (même catégorie)
  const related = await queryMany<Media>(
    "SELECT * FROM medias WHERE statut = 'approved' AND categorie = $1 AND id != $2 ORDER BY created_at DESC LIMIT 8",
    [media.categorie, media.id]
  )

  // JSON-LD pour Google (SEO structuré)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'
  const contributeurNom =
    `${media.contributeur_prenom || ''} ${media.contributeur_nom || ''}`.trim()

  const jsonLd =
    media.type === 'photo'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ImageObject',
          name: media.titre,
          description: media.description,
          contentUrl: media.cloudinary_url,
          url: `${appUrl}/photos/${media.slug}`,
          author: { '@type': 'Person', name: contributeurNom || 'BurkinaVista' },
          license: `https://creativecommons.org/licenses/${media.licence
            .toLowerCase()
            .replace(' ', '-')}/4.0/`,
          acquireLicensePage: `${appUrl}/licences`,
          creditText: `BurkinaVista — ${contributeurNom}`,
          creator: { '@type': 'Person', name: contributeurNom || 'BurkinaVista' },
          copyrightNotice: media.licence,
          contentLocation: {
            '@type': 'Place',
            name: `${media.ville || 'Burkina Faso'}, Burkina Faso`,
          },
          keywords: media.tags?.join(', '),
          width: media.width,
          height: media.height,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: media.titre,
          description: media.description,
          thumbnailUrl: media.thumbnail_url,
          // b2_url remplace stream_url — URL Backblaze B2 via Cloudflare CDN
          contentUrl: media.b2_url,
          uploadDate: media.created_at,
          duration: media.duration
            ? `PT${Math.floor(media.duration / 60)}M${media.duration % 60}S`
            : undefined,
          author: { '@type': 'Person', name: contributeurNom || 'BurkinaVista' },
        }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PhotoDetailClient media={media} related={related} />
    </>
  )
}
