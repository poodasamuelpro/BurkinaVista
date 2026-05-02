/**
 * app/api/medias/[slug]/view/route.ts — Compteur de vues côté client
 *
 * AJOUT (Audit 2026-05-01) :
 *  [VIEW-COUNTER-01] Avant : l'incrément `views = views + 1` était fait dans
 *                    app/photos/[slug]/page.tsx (Server Component) à chaque
 *                    render. Conséquence : Googlebot, Next.js prefetch et
 *                    healthchecks gonflaient artificiellement le compteur.
 *
 *  Désormais l'incrément est appelé depuis PhotoDetailClient.tsx via un
 *  useEffect (donc seulement sur exécution navigateur réel). Cette route :
 *
 *    1. Refuse les requêtes prefetch Next.js (purpose: 'prefetch' /
 *       sec-purpose: 'prefetch' / next-router-prefetch).
 *    2. Filtre les bots via User-Agent (lib/security.ts -> isBotUserAgent).
 *    3. Applique un cookie de session court (10 min) pour éviter de compter
 *       plusieurs vues du même utilisateur dans la même session.
 *    4. Incrémente atomiquement views via SQL.
 *
 *  Réponse : 200 quoi qu'il arrive (le compteur est best-effort).
 */
import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { isBotUserAgent } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VIEW_COOKIE_PREFIX = 'bv_view_'
const VIEW_COOKIE_MAX_AGE = 600 // 10 minutes

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ counted: false }, { status: 200 })
    }

    // [VIEW-COUNTER-01] Filtrage prefetch — Next.js ajoute ces headers sur les
    // navigations préchargées. On NE compte PAS ces requêtes.
    const purpose = req.headers.get('purpose')
    const secPurpose = req.headers.get('sec-purpose')
    const nextRouterPrefetch = req.headers.get('next-router-prefetch')
    const xPurpose = req.headers.get('x-purpose')
    if (
      purpose === 'prefetch' ||
      secPurpose?.includes('prefetch') ||
      nextRouterPrefetch === '1' ||
      xPurpose === 'preview'
    ) {
      return NextResponse.json({ counted: false, reason: 'prefetch' })
    }

    // [VIEW-COUNTER-01] Filtrage User-Agent (bots)
    const userAgent = req.headers.get('user-agent')
    if (isBotUserAgent(userAgent)) {
      return NextResponse.json({ counted: false, reason: 'bot' })
    }

    // [VIEW-COUNTER-01] Cookie de session — empêche de re-compter une vue
    // du même client pendant 10 minutes (debounce léger côté serveur)
    const cookieName = `${VIEW_COOKIE_PREFIX}${encodeURIComponent(slug).substring(0, 60)}`
    const seen = req.cookies.get(cookieName)?.value
    if (seen === '1') {
      return NextResponse.json({ counted: false, reason: 'recent' })
    }

    // Vérifier que le média existe et est approuvé
    const media = await queryOne<{ id: string }>(
      "SELECT id FROM medias WHERE slug = $1 AND statut = 'approved' LIMIT 1",
      [slug]
    )
    if (!media) {
      return NextResponse.json({ counted: false, reason: 'not-found' })
    }

    // Incrément atomique
    await query(
      'UPDATE medias SET views = views + 1 WHERE id = $1',
      [media.id]
    )

    const response = NextResponse.json({ counted: true })
    response.cookies.set(cookieName, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: VIEW_COOKIE_MAX_AGE,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('[view-counter] Erreur:', error)
    // Best-effort : on ne casse jamais la page si le compteur foire
    return NextResponse.json({ counted: false, reason: 'error' })
  }
}
