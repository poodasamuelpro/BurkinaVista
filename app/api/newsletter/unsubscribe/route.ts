/**
 * app/api/newsletter/unsubscribe/route.ts — Désabonnement newsletter
 * GET /api/newsletter/unsubscribe?email=xxx&token=yyy
 * Désactive l'abonné et retourne une page HTML de confirmation
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email || !token) {
    return htmlResponse('❌ Lien invalide', 'Paramètres manquants dans le lien de désabonnement.', false)
  }

  // Vérifier le token JWT
  const tokenEmail = await verifyUnsubscribeToken(token)

  if (!tokenEmail || tokenEmail.toLowerCase() !== email.toLowerCase()) {
    return htmlResponse(
      '❌ Lien expiré',
      'Ce lien de désabonnement est expiré ou invalide.',
      false
    )
  }

  // Désactiver l'abonné
  await query(
    'UPDATE abonnes SET actif = false WHERE email = $1',
    [email.toLowerCase()]
  )

  return htmlResponse(
    '✅ Désabonnement confirmé',
    `L'adresse ${email} a été retirée de notre liste de diffusion. Vous ne recevrez plus nos newsletters.`,
    true
  )
}

/**
 * Génère une réponse HTML de confirmation
 */
function htmlResponse(title: string, message: string, success: boolean): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BurkinaVista — Désabonnement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0A0A0A; color: #fff; font-family: Arial, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 480px; width: 100%; text-align: center; }
    .logo { margin-bottom: 32px; }
    .card { background: #1A1A2E; border-radius: 16px; padding: 40px; border: 1px solid ${success ? 'rgba(0,154,0,0.3)' : 'rgba(239,43,45,0.3)'}; }
    .title { font-size: 26px; font-weight: bold; color: ${success ? '#009A00' : '#EF2B2D'}; margin-bottom: 16px; }
    .message { color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background: #EFC031; color: #000; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; }
    .footer { margin-top: 24px; color: rgba(255,255,255,0.2); font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg width="60" height="40" viewBox="0 0 60 40" fill="none">
        <rect width="60" height="20" fill="#EF2B2D"/>
        <rect y="20" width="60" height="20" fill="#009A00"/>
        <polygon points="30,8 32.3,16.5 41,16.5 34,21.5 36.5,30 30,25.2 23.5,30 26,21.5 19,16.5 27.7,16.5" fill="#EFC031"/>
      </svg>
      <p style="color:#EFC031;font-size:18px;font-weight:bold;margin-top:8px;">BurkinaVista</p>
    </div>
    <div class="card">
      <div class="title">${title}</div>
      <p class="message">${message}</p>
      <a href="${appUrl}" class="btn">Retour au site</a>
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
