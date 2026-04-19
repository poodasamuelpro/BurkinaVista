import { notFound } from 'next/navigation' 
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import PhotoDetailClient from './PhotoDetailClient'
import type { Media } from '@/types'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: media } = await supabase
    .from('medias')
    .select('*, auteur:profiles(nom)')
    .eq('slug', params.slug)
    .eq('statut', 'approved')
    .single()

  if (!media) return { title: 'Média introuvable' }

  return {
    title: media.titre,
    description: media.description,
    keywords: media.tags,
    openGraph: {
      title: media.titre,
      description: media.description,
      images: [{ url: media.cloudinary_url || media.thumbnail_url || '' }],
      type: media.type === 'video' ? 'video.other' : 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: media.titre,
      description: media.description,
      images: [media.cloudinary_url || media.thumbnail_url || ''],
    },
  }
}

export default async function PhotoDetailPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: media } = await supabase
    .from('medias')
    .select('*, auteur:profiles(id, nom, avatar_url, bio, photos_count)')
    .eq('slug', params.slug)
    .eq('statut', 'approved')
    .single()

  if (!media) notFound()

  // Incrémenter views — fix: pas de .catch() sur rpc, on ignore l'erreur autrement
  try {
    await supabase.rpc('increment_views', { media_id: media.id })
  } catch {}

  // Médias similaires
  const { data: related } = await supabase
    .from('medias')
    .select('*')
    .eq('statut', 'approved')
    .eq('categorie', media.categorie)
    .neq('id', media.id)
    .limit(8)

  // JSON-LD pour Google
  const jsonLd = media.type === 'photo'
    ? {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name: media.titre,
        description: media.description,
        contentUrl: media.cloudinary_url,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/photos/${media.slug}`,
        author: { '@type': 'Person', name: media.auteur?.nom },
        license: `https://creativecommons.org/licenses/${media.licence.toLowerCase().replace(' ', '-')}/4.0/`,
        acquireLicensePage: `${process.env.NEXT_PUBLIC_APP_URL}/licences`,
        creditText: `FasoStock — ${media.auteur?.nom}`,
        creator: { '@type': 'Person', name: media.auteur?.nom },
        copyrightNotice: media.licence,
        contentLocation: { '@type': 'Place', name: `${media.ville || ''}, Burkina Faso` },
        keywords: media.tags?.join(', '),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: media.titre,
        description: media.description,
        thumbnailUrl: media.thumbnail_url,
        contentUrl: media.stream_url,
        uploadDate: media.created_at,
        duration: media.duration ? `PT${Math.floor(media.duration / 60)}M${media.duration % 60}S` : undefined,
        author: { '@type': 'Person', name: media.auteur?.nom },
      }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PhotoDetailClient
        media={media as Media}
        related={(related || []) as Media[]}
      />
    </>
  )
}