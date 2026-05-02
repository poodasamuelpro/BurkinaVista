/**
 * app/api/contact/route.ts — API de contact BurkinaVista
 * Envoie un email à BurkinaVista@gmail.com + confirmation à l'expéditeur
 *
 * AUDIT 2026-05-01 — CORRECTIONS APPLIQUÉES :
 *  [CONTACT-01] Rate-limiting par IP (5 messages / 10 min) — RATE_LIMITS.CONTACT
 *  [CONTACT-02] Captcha Cloudflare Turnstile (header X-Turnstile-Token ou champ
 *               turnstileToken du body). Skip silencieux si non configuré.
 *  [CONTACT-03] Échappement HTML des variables interpolées dans les templates email
 *               (firstname, lastname, email, subject, type, message). Avant cette
 *               correction, un message contenant <script> ou du HTML s'affichait
 *               brut dans la boîte mail de l'admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimitByIp, RATE_LIMITS, rateLimitHeaders, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { escapeHtml } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@burkinavista.poodasamuel.com'
const FROM_DISPLAY = `NoreplyBurkinaVista <${FROM_EMAIL}>`
const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'BurkinaVista@gmail.com'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  // [CONTACT-01] Rate-limit par IP
  const rl = await rateLimitByIp(req, RATE_LIMITS.CONTACT)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de messages envoyés. Merci de patienter quelques minutes.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const body = await req.json()
    const { firstname, lastname, email, subject, type, message, turnstileToken } = body

    if (!firstname || !lastname || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    // [CONTACT-02] Captcha Turnstile
    const headerToken = req.headers.get('x-turnstile-token')
    const captchaToken = headerToken || turnstileToken
    const captchaOk = await verifyTurnstile(captchaToken, getClientIp(req))
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Vérification anti-spam échouée. Veuillez recharger la page et réessayer.' },
        { status: 400, headers: rateLimitHeaders(rl) }
      )
    }

    const typeLabels: Record<string, string> = {
      complaint: 'Plainte',
      recommendation: 'Recommandation',
      advice: 'Conseil',
      dispute: 'Litige',
      report: 'Signalement',
      question: 'Question générale',
      other: 'Autre',
    }
    const typeLabel = type ? (typeLabels[type] || String(type)) : 'Non spécifié'

    // [CONTACT-03] Échappement HTML systématique des variables non fiables
    const safeFirstname = escapeHtml(firstname).substring(0, 100)
    const safeLastname  = escapeHtml(lastname).substring(0, 100)
    const safeEmail     = escapeHtml(email).substring(0, 200)
    const safeSubject   = escapeHtml(subject).substring(0, 200)
    const safeTypeLabel = escapeHtml(typeLabel)
    const safeMessage   = escapeHtml(message).substring(0, 5000)

    // Email à l'admin BurkinaVista@gmail.com
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: ADMIN_EMAIL,
      reply_to: email,
      subject: `📬 [Contact BurkinaVista] ${typeLabel} — ${String(subject).substring(0, 100)}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="16" fill="#EF2B2D"/>
        <rect y="16" width="48" height="16" fill="#009A00"/>
        <polygon points="24,7 25.8,13 31.2,13 26.9,16.8 28.5,22.5 24,19 19.5,22.5 21.1,16.8 16.8,13 22.2,13" fill="#EFC031"/>
      </svg>
      <p style="color:#EFC031;font-size:18px;font-weight:bold;margin-top:8px;">BurkinaVista</p>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;">Nouveau message de contact</p>
    </div>
    <div style="background:#1A1A2E;border-radius:16px;padding:32px;border:1px solid rgba(239,192,49,0.2);">
      <h2 style="color:#EFC031;font-size:20px;margin:0 0 20px 0;">${safeSubject}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:13px;width:35%;">De</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">${safeFirstname} ${safeLastname}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:13px;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#EFC031;font-size:13px;">${safeEmail}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:13px;">Type</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">${safeTypeLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;">Date</td>
          <td style="padding:10px 0;color:#fff;font-size:13px;">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      </table>
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px;border-left:3px solid #EFC031;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px 0;">Message</p>
        <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${safeMessage}</p>
      </div>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} BurkinaVista — BurkinaVista@gmail.com
    </p>
  </div>
</body>
</html>
      `,
    })

    // Email de confirmation à l'expéditeur
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: email,
      subject: '✅ Votre message a bien été reçu — BurkinaVista',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="16" fill="#EF2B2D"/>
        <rect y="16" width="48" height="16" fill="#009A00"/>
        <polygon points="24,7 25.8,13 31.2,13 26.9,16.8 28.5,22.5 24,19 19.5,22.5 21.1,16.8 16.8,13 22.2,13" fill="#EFC031"/>
      </svg>
      <p style="color:#EFC031;font-size:18px;font-weight:bold;margin-top:8px;">BurkinaVista</p>
    </div>
    <div style="background:#1A1A2E;border-radius:16px;padding:40px;border:1px solid rgba(0,154,0,0.2);">
      <h1 style="color:#EFC031;font-size:26px;margin:0 0 16px 0;">Merci ${safeFirstname} ! ✅</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px 0;">
        Nous avons bien reçu votre message concernant <strong style="color:#fff;">"${safeSubject}"</strong>.
      </p>
      <div style="background:rgba(239,192,49,0.08);border-radius:12px;padding:20px;border:1px solid rgba(239,192,49,0.2);margin-bottom:24px;">
        <p style="color:#EFC031;font-size:13px;font-weight:bold;margin:0 0 8px 0;">⏱️ Délai de réponse</p>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">Notre équipe vous répondra dans les <strong style="color:#fff;">48 heures</strong> à cette adresse email.</p>
      </div>
      <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0;">
        Si votre demande est urgente, vous pouvez également nous écrire directement à<br/>
        <a href="mailto:BurkinaVista@gmail.com" style="color:#EFC031;text-decoration:none;">BurkinaVista@gmail.com</a>
      </p>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} BurkinaVista
    </p>
  </div>
</body>
</html>
      `,
    })

    return NextResponse.json({ success: true }, { headers: rateLimitHeaders(rl) })
  } catch (error) {
    console.error('Erreur API contact:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: rateLimitHeaders(rl) }
    )
  }
}
