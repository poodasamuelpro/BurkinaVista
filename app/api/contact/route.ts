/**
 * app/api/contact/route.ts — API de contact BurkinaVista
 * Envoie un email à BurkinaVista@gmail.com + confirmation à l'expéditeur
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Adresse technique réelle (domaine vérifié sur Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@burkinavista.poodasamuel.com'
// Nom affiché dans la boîte du destinataire
const FROM_DISPLAY = `NoreplyBurkinaVista <${FROM_EMAIL}>`

// Email de réception des messages de contact → Gmail BurkinaVista
const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'BurkinaVista@gmail.com'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstname, lastname, email, subject, type, message } = body

    if (!firstname || !lastname || !email || !subject || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
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
    const typeLabel = type ? (typeLabels[type] || type) : 'Non spécifié'

    // Email à l'admin BurkinaVista@gmail.com
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: ADMIN_EMAIL,
      reply_to: email,
      subject: `📬 [Contact BurkinaVista] ${typeLabel} — ${subject}`,
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
      <h2 style="color:#EFC031;font-size:20px;margin:0 0 20px 0;">${subject}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:13px;width:35%;">De</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">${firstname} ${lastname}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:13px;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#EFC031;font-size:13px;">${email}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:13px;">Type</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">${typeLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;">Date</td>
          <td style="padding:10px 0;color:#fff;font-size:13px;">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      </table>
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px;border-left:3px solid #EFC031;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px 0;">Message</p>
        <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${message}</p>
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
      <h1 style="color:#EFC031;font-size:26px;margin:0 0 16px 0;">Merci ${firstname} ! ✅</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px 0;">
        Nous avons bien reçu votre message concernant <strong style="color:#fff;">"${subject}"</strong>.
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API contact:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
