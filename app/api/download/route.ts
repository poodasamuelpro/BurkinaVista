/**
 * app/api/download/route.ts — Téléchargement de médias
 * Incrémente le compteur downloads dans Neon
 * Retourne cloudinary_url pour les photos, b2_url pour les vidéos
 */
import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { mediaId } = await req.json()

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId requis' }, { status: 400 })
    }

    // Récupérer le média
    const media = await queryOne<{
      id: string
      cloudinary_url: string | null
      b2_url: string | null
      slug: string
      type: string
    }>(
      'SELECT id, cloudinary_url, b2_url, slug, type FROM medias WHERE id = $1 AND statut = $2',
      [mediaId, 'approved']
    )

    if (!media) {
      return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })
    }

    // Incrémenter le compteur de téléchargements
    await query(
      'UPDATE medias SET downloads = downloads + 1 WHERE id = $1',
      [mediaId]
    )

    return NextResponse.json({
      url: media.type === 'photo' ? media.cloudinary_url : media.b2_url,
    })
  } catch (error) {
    console.error('[download] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
