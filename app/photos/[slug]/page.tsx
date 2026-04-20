/**
 * app/photos/[slug]/page.tsx — Page détail d'un média
 * Metadata SEO + JSON-LD
 * Sans Supabase — utilise Neon
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { queryOne, queryMany, query } from '@/lib/db'
import PhotoDetailClient from './PhotoDetailClient'
import type { Media } from '@/types'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const media = await queryOne<Media>(
    "SELECT * FROM medias WHERE slug = $1 AND statut = 'approved'",
    [params.slug]
  )

  if (!media) return { title: 'Média introuvable — BurkinaVista' }

  return {
    title: `${media.titre} — BurkinaVista`,
    description: media.description || `Photo du Burkina Faso — ${media.categorie}`,
    keywords: media.tags,
    openGraph: {
      title: media.titre,
      description: media.description || '',
      images: [{ url: media.cloudinary_url || media.thumbnail_url || '' }],
      type: media.type === 'video' ? 'video.other' : 'article',
      locale: 'fr_FR',
      siteName: 'BurkinaVista',
    },
    twitter: {
      card: 'summary_large_image',
      title: media.titre,
      description: media.description || '',
      images: [media.cloudinary_url || media.thumbnail_url || ''],
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
  const contributeurNom = `${media.contributeur_prenom || ''} ${media.contributeur_nom || ''}`.trim()

  const jsonLd = media.type === 'photo'
    ? {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: media.titre,
        description: media.description,
        contentUrl: media.cloudinary_url,
        url: `${appUrl}/photos/${media.slug}`,
        author: { '@type': 'Person', name: contributeurNom || 'BurkinaVista' },
        license: `https://creativecommons.org/licenses/${media.licence.toLowerCase().replace(' ', '-')}/4.0/`,
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
        contentUrl: media.stream_url,
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
