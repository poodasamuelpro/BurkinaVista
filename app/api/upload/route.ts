import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { generateSEOFromImage, analyzeWithGoogleVision } from '@/lib/ai-seo'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Auth check
    const authHeader = req.headers.get('cookie') || ''
    const { data: { user } } = await supabase.auth.getUser()

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const titre = formData.get('titre') as string || ''
    const description = formData.get('description') as string || ''
    const ville = formData.get('ville') as string || ''
    const region = formData.get('region') as string || ''
    const categorie = formData.get('categorie') as string
    const licence = formData.get('licence') as string || 'CC BY'
    const tagsRaw = formData.get('tags') as string || ''

    if (!file || !categorie) {
      return NextResponse.json({ error: 'Fichier et catégorie requis' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let cloudinaryResult = null
    let streamResult = null
    let thumbnailUrl = ''

    if (type === 'photo') {
      // Upload image vers Cloudinary
      cloudinaryResult = await uploadToCloudinary(buffer, 'fasostock/photos')

      // Analyse Google Vision
      const visionData = await analyzeWithGoogleVision(cloudinaryResult.url)

      // Génération SEO par IA
      const userInput = {
        titre, description, ville, region, categorie,
        licence: licence as any,
        tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [],
      }
      const seoData = await generateSEOFromImage(cloudinaryResult.url, userInput, visionData)

      // Sauvegarde en DB
      const { data: media, error } = await supabase.from('medias').insert({
        type: 'photo',
        cloudinary_url: cloudinaryResult.url,
        cloudinary_public_id: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        slug: seoData.slug,
        titre: seoData.titre,
        description: seoData.description,
        alt_text: seoData.alt_text,
        tags: seoData.tags,
        categorie,
        ville: ville || null,
        region: region || null,
        auteur_id: user?.id || null,
        licence,
        statut: 'pending',
      }).select().single()

      if (error) throw error

      // Ping Google sitemap
      await pingGoogle()

      return NextResponse.json({ success: true, media })

    } else {
      // Vidéo — Upload vers Cloudflare Stream
      const streamData = await uploadToCloudflareStream(buffer, file.name)

      const seoData = await generateSEOFromText({
        titre, description, ville, region, categorie,
        tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [],
      })

      const { data: media, error } = await supabase.from('medias').insert({
        type: 'video',
        stream_url: streamData.playbackUrl,
        stream_id: streamData.uid,
        thumbnail_url: streamData.thumbnail,
        slug: seoData.slug,
        titre: seoData.titre,
        description: seoData.description,
        alt_text: seoData.alt_text,
        tags: seoData.tags,
        categorie,
        ville: ville || null,
        region: region || null,
        auteur_id: user?.id || null,
        licence,
        statut: 'pending',
      }).select().single()

      if (error) throw error

      await pingGoogle()

      return NextResponse.json({ success: true, media })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function uploadToCloudflareStream(buffer: Buffer, filename: string) {
  const formData = new FormData()
  formData.append('file', new Blob([buffer]), filename)

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}` },
      body: formData,
    }
  )
  const data = await res.json()
  return {
    uid: data.result.uid,
    playbackUrl: `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${data.result.uid}/manifest/video.m3u8`,
    thumbnail: `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${data.result.uid}/thumbnails/thumbnail.jpg`,
  }
}

async function generateSEOFromText(input: any) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const { default: slugify } = await import('slugify')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Tu es un expert SEO sur le Burkina Faso.
Génère des métadonnées SEO pour cette vidéo basées sur:
- Titre utilisateur: ${input.titre || 'non fourni'}
- Description: ${input.description || 'non fournie'}
- Ville: ${input.ville || 'non fournie'}
- Catégorie: ${input.categorie}

Réponds UNIQUEMENT avec ce JSON:
{"titre":"...","description":"...","alt_text":"...","tags":["..."]}`

  const res = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
  const data = JSON.parse(text.replace(/```json|```/g, '').trim())
  const slug = `${slugify(data.titre || input.titre || 'video-burkina', { lower: true, strict: true })}-${Date.now()}`

  return { ...data, slug }
}

async function pingGoogle() {
  try {
    await fetch(
      `https://www.google.com/ping?sitemap=${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`
    )
  } catch {}
}
