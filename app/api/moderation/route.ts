/**
 * app/api/moderation/route.ts — Modération directe depuis l'email
 * Approve ou refuse un média via token JWT (sans connexion au dashboard)
 * GET /api/moderation?action=approve&id=xxx&token=yyy
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyModerationToken } from '@/lib/auth'
import { queryOne, query } from '@/lib/db'
import { sendApprovalConfirmation } from '@/lib/email'
import type { Media } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') as 'approve' | 'reject' | null
  const mediaId = searchParams.get('id')
  const token = searchParams.get('token')

  // Validation des paramètres
  if (!action || !mediaId || !token) {
    return htmlResponse('❌ Lien invalide', 'Paramètres manquants dans le lien de modération.', false)
  }

  if (action !== 'approve' && action !== 'reject') {
    return htmlResponse('❌ Action invalide', 'L\'action doit être "approve" ou "reject".', false)
  }

  // Vérifier le token JWT
  const tokenData = await verifyModerationToken(token)

  if (!tokenData) {
    return htmlResponse(
      '❌ Token expiré ou invalide',
      'Ce lien de modération est expiré (72h) ou invalide. Connectez-vous au dashboard admin.',
      false
    )
  }

  if (tokenData.mediaId !== mediaId || tokenData.action !== action) {
    return htmlResponse('❌ Token invalide', 'Ce token ne correspond pas à l\'action demandée.', false)
  }

  // Récupérer le média
  const media = await queryOne<Media>(
    'SELECT * FROM medias WHERE id = $1',
    [mediaId]
  )

  if (!media) {
    return htmlResponse('❌ Média introuvable', 'Ce média n\'existe plus dans la base de données.', false)
  }

  if (media.statut !== 'pending') {
    return htmlResponse(
      `ℹ️ Déjà traité`,
      `Ce média a déjà été ${media.statut === 'approved' ? 'approuvé' : 'refusé'}.`,
      media.statut === 'approved'
    )
  }

  // Mettre à jour le statut
  if (action === 'approve') {
    await query(
      'UPDATE medias SET statut = $1, updated_at = NOW() WHERE id = $2',
      ['approved', mediaId]
    )

    // Envoyer confirmation au contributeur
    if (media.contributeur_email && media.contributeur_prenom) {
      sendApprovalConfirmation(
        media.contributeur_email,
        media.contributeur_prenom,
        media.titre,
        media.slug
      ).catch((err) => console.error('Erreur email approbation:', err))
    }

    return htmlResponse(
      '✅ Média approuvé !',
      `Le média "${media.titre}" a été approuvé avec succès et est maintenant visible sur BurkinaVista.`,
      true
    )
  } else {
    await query(
      'UPDATE medias SET statut = $1, updated_at = NOW() WHERE id = $2',
      ['rejected', mediaId]
    )

    return htmlResponse(
      '❌ Média refusé',
      `Le média "${media.titre}" a été refusé et ne sera pas publié sur BurkinaVista.`,
      false
    )
  }
}

/**
 * Génère une réponse HTML simple de confirmation
 */
function htmlResponse(title: string, message: string, success: boolean): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'
  const color = success ? '#009A00' : '#EF2B2D'
  const borderColor = success ? 'rgba(0,154,0,0.3)' : 'rgba(239,43,45,0.3)'

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BurkinaVista — Modération</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0A0A0A; color: #fff; font-family: Arial, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 500px; width: 100%; text-align: center; }
    .logo { margin-bottom: 32px; }
    .logo span { font-size: 24px; font-weight: bold; }
    .card { background: #1A1A2E; border-radius: 16px; padding: 40px; border: 1px solid ${borderColor}; }
    .title { font-size: 28px; font-weight: bold; color: ${color}; margin-bottom: 16px; }
    .message { color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
    .btn { display: inline-block; background: #EFC031; color: #000; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-weight: bold; font-size: 15px; }
    .footer { margin-top: 24px; color: rgba(255,255,255,0.2); font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="20" fill="#EF2B2D"/>
        <rect y="20" width="60" height="20" fill="#009A00"/>
        <polygon points="30,8 32.3,16.5 41,16.5 34,21.5 36.5,30 30,25.2 23.5,30 26,21.5 19,16.5 27.7,16.5" fill="#EFC031"/>
      </svg>
      <p style="color:#EFC031;font-size:18px;font-weight:bold;margin-top:8px;">BurkinaVista</p>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;">Administration — Modération</p>
    </div>
    <div class="card">
      <div class="title">${title}</div>
      <p class="message">${message}</p>
      <a href="${appUrl}/admin/photos?statut=pending" class="btn">Voir les médias en attente</a>
    </div>
    <p class="footer">© ${new Date().getFullYear()} BurkinaVista</p>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}
