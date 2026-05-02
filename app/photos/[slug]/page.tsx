/**
 * app/photos/[slug]/page.tsx — Page détail d'un média
 * Metadata SEO + JSON-LD — bilingue FR/EN
 *
 * AUDIT 2026-05-01 — CORRECTIONS APPLIQUÉES :
 *  [PHOTO-01] L'incrément du compteur de vues était fait côté serveur (à chaque
 *             render SSR), ce qui :
 *               • comptait Googlebot, Bingbot, prefetch Next.js, healthchecks…
 *               • n'était pas filtrable et déformait totalement les statistiques
 *             → Suppression du UPDATE views ici. La logique est déplacée côté
 *               client dans PhotoDetailClient.tsx via un useEffect qui appelle
 *               POST /api/medias/:slug/view (avec filtre bots côté serveur).
 *
 *  [PHOTO-02] JSON-LD construit avec JSON.stringify direct dans
 *             dangerouslySetInnerHTML — vulnérable à une rupture de balise
 *             </script> si une description IA contenait ces caractères.
 *             → Utilisation de safeJsonLdStringify() qui échappe < > & U+2028 U+2029.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { queryOne, queryMany } from '@/lib/db'
import PhotoDetailClient from './PhotoDetailClient'
import { safeJsonLdStringify } from '@/lib/security'
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

  // [PHOTO-01] Incrément vues retiré ici — désormais déclenché côté client
  // via PhotoDetailClient.tsx → POST /api/medias/:slug/view (filtre bots)

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
      {/* [PHOTO-02] safeJsonLdStringify échappe les chevrons et séparateurs Unicode
          pour empêcher toute rupture de balise </script> via une description IA. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <PhotoDetailClient media={media} related={related} />
    </>
  )
}
