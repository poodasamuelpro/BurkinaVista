import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { mediaId } = await req.json()
    const supabase = await createAdminClient()

    const { data: media } = await supabase
      .from('medias')
      .select('cloudinary_url, stream_url, slug, type')
      .eq('id', mediaId)
      .single()

    if (!media) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    // Incrémenter downloads
    await supabase.rpc('increment_downloads', { media_id: mediaId })

    // Log download
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    await supabase.from('downloads').insert({ media_id: mediaId, ip_address: ip })

    return NextResponse.json({
      url: media.type === 'photo' ? media.cloudinary_url : media.stream_url,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
