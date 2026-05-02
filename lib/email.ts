/**
 * lib/email.ts — Envoi d'emails avec Resend
 * Confirmation contributeur, notification admin, newsletter, bienvenue
 * Anti-spam : List-Unsubscribe headers, sujets sans emojis, nom expéditeur neutre
 *
 * AUDIT 2026-05-01 — CORRECTION APPLIQUÉE :
 *  [EMAIL-XSS] Échappement HTML systématique des variables IA (titre, description,
 *              alt_text…) et des saisies contributeur (prénom, nom, email, téléphone)
 *              avant interpolation dans les templates. Avant cette correction, un
 *              titre généré par Gemini contenant des balises HTML (improbable mais
 *              possible via injection prompt) ou un nom de contributeur contenant
 *              `<img onerror=…>` aurait été rendu tel quel dans la boîte mail admin.
 */
import { Resend } from 'resend'
import { createModerationToken, createUnsubscribeToken } from './auth'
import { escapeHtml } from './security'
import type { Media, Abonne } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@burkinavista.poodasamuel.com'
const FROM_DISPLAY = `BurkinaVista <${FROM_EMAIL}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// ============================================================
// ÉLÉMENTS COMMUNS
// ============================================================

const logoSvg = `
  <svg width="36" height="24" viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
    <rect width="40" height="13.5" fill="#EF2B2D"/>
    <rect y="13.5" width="40" height="13.5" fill="#009A00"/>
    <polygon points="20,6 21.5,11 26,11 22.5,14 23.8,19 20,16 16.2,19 17.5,14 14,11 18.5,11" fill="#EFC031"/>
  </svg>
`

const emailHeader = `
  <div style="text-align:center;padding:28px 32px;background:#0A0A0A;border-bottom:1px solid rgba(255,255,255,0.05);">
    ${logoSvg}
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:bold;color:#ffffff;font-family:Arial,sans-serif;">BurkinaVista</span>
  </div>
`

const emailFooterSimple = `
  <div style="text-align:center;padding:24px 32px;border-top:1px solid rgba(255,255,255,0.05);">
    <p style="color:rgba(255,255,255,0.2);font-size:12px;font-family:Arial,sans-serif;margin:0;">
      © ${new Date().getFullYear()} BurkinaVista &nbsp;·&nbsp;
      <a href="${APP_URL}" style="color:#EFC031;text-decoration:none;">burkinavista.com</a>
    </p>
  </div>
`

const wrapEmail = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#111111;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0A0A0A;border-radius:12px;overflow:hidden;">
    ${emailHeader}
    ${content}
    ${emailFooterSimple}
  </div>
</body>
</html>
`

// ============================================================
// CONFIRMATION AU CONTRIBUTEUR
// ============================================================

export async function sendContributorConfirmation(
  email: string,
  prenom: string,
  titre: string
): Promise<void> {
  try {
    // [EMAIL-XSS] Échappement systématique des variables interpolées
    const safePrenom = escapeHtml(prenom)
    const safeTitre = escapeHtml(titre)
    const safeSubjectTitre = String(titre).substring(0, 100)

    await resend.emails.send({
      from: FROM_DISPLAY,
      to: email,
      subject: `Votre contribution a bien été reçue — BurkinaVista`,
      html: wrapEmail(`
        <div style="padding:36px 32px;">
          <h1 style="font-size:22px;font-weight:bold;color:#EFC031;margin:0 0 16px 0;">Merci ${safePrenom} !</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 24px 0;">
            Votre contribution <strong style="color:#ffffff;">"${safeTitre}"</strong> a bien été reçue 
            et est en attente de validation par notre équipe.
          </p>
          <div style="background:rgba(239,192,49,0.08);border-left:3px solid #EFC031;padding:16px 20px;border-radius:4px;margin:0 0 24px 0;">
            <p style="color:#EFC031;font-size:13px;font-weight:bold;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.05em;">Prochaines étapes</p>
            <ul style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;padding-left:18px;line-height:2.2;">
              <li>Notre équipe examine votre média sous <strong style="color:#ffffff;">48h</strong></li>
              <li>Si approuvé, il sera publié sur BurkinaVista</li>
              <li>Vous recevrez un email de confirmation</li>
            </ul>
          </div>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.6;margin:0;">
            Merci de contribuer à valoriser le patrimoine visuel du Burkina Faso.
          </p>
        </div>
      `),
    })
    // Reference safeSubjectTitre pour éviter l'avertissement TS unused variable
    void safeSubjectTitre
  } catch (error) {
    console.error('Erreur envoi email confirmation contributeur:', error)
  }
}

// ============================================================
// NOTIFICATION ADMIN (nouveau média en attente)
// ============================================================

export async function sendAdminNotification(media: Media & {
  contributeur_nom?: string
  contributeur_prenom?: string
  contributeur_email?: string
  contributeur_tel?: string
}): Promise<void> {
  try {
    if (!ADMIN_EMAIL) {
      console.error('ADMIN_EMAIL non défini')
      return
    }

    const approveToken = await createModerationToken(media.id, 'approve')
    const rejectToken = await createModerationToken(media.id, 'reject')
    const approveUrl = `${APP_URL}/api/moderation?action=approve&id=${encodeURIComponent(media.id)}&token=${encodeURIComponent(approveToken)}`
    const rejectUrl = `${APP_URL}/api/moderation?action=reject&id=${encodeURIComponent(media.id)}&token=${encodeURIComponent(rejectToken)}`

    // [EMAIL-XSS] Échappement de toutes les variables non fiables
    const safeTitre = escapeHtml(media.titre)
    const safeAlt = escapeHtml(media.alt_text || media.titre)
    const safeCategorie = escapeHtml(media.categorie)
    const safeVille = escapeHtml(media.ville || '')
    const safeRegion = escapeHtml(media.region || '')
    const safeLicence = escapeHtml(media.licence)
    const safePrenom = escapeHtml(media.contributeur_prenom || '')
    const safeNom = escapeHtml(media.contributeur_nom || '')
    const safeEmail = escapeHtml(media.contributeur_email || '')
    const safeTel = escapeHtml(media.contributeur_tel || '')
    const safeImageUrl = encodeURI(media.cloudinary_url || media.thumbnail_url || '')

    const mediaHtml = (media.type === 'photo' && media.cloudinary_url)
      ? `<img src="${safeImageUrl}" alt="${safeAlt}" style="max-width:100%;border-radius:10px;display:block;margin:0 auto 24px auto;" />`
      : media.thumbnail_url
        ? `<img src="${safeImageUrl}" alt="${safeAlt}" style="max-width:100%;border-radius:10px;display:block;margin:0 auto 24px auto;" />`
        : `<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:32px;text-align:center;color:rgba(255,255,255,0.3);margin-bottom:24px;font-size:14px;">Pas de miniature disponible</div>`

    await resend.emails.send({
      from: FROM_DISPLAY,
      to: ADMIN_EMAIL,
      subject: `Nouveau média en attente de modération — ${String(media.titre).substring(0, 100)}`,
      html: wrapEmail(`
        <div style="padding:36px 32px;">
          <p style="color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 20px 0;">Administration — Modération</p>
          <h1 style="font-size:20px;font-weight:bold;color:#ffffff;margin:0 0 24px 0;">Nouveau média en attente</h1>

          ${mediaHtml}

          <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:13px;width:35%;">Titre</td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;font-weight:bold;">${safeTitre}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:13px;">Type</td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;">${media.type === 'video' ? 'Vidéo' : 'Photo'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:13px;">Catégorie</td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#EFC031;font-size:13px;">${safeCategorie}</td>
              </tr>
              ${safeVille ? `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:13px;">Lieu</td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;">${safeVille}${safeRegion ? `, ${safeRegion}` : ''}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:13px;">Licence</td>
                <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;">${safeLicence}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:rgba(255,255,255,0.35);font-size:13px;">Date upload</td>
                <td style="padding:8px 0;color:#ffffff;font-size:13px;">${new Date(media.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            </table>
          </div>

          <div style="background:rgba(0,154,0,0.08);border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid rgba(0,154,0,0.15);">
            <p style="color:#009A00;font-size:12px;font-weight:bold;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.05em;">Contributeur</p>
            <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:0 0 6px 0;">${safePrenom} ${safeNom}</p>
            ${safeEmail ? `<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 4px 0;">${safeEmail}</p>` : ''}
            ${safeTel ? `<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">${safeTel}</p>` : ''}
          </div>

          <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0 0 16px 0;">Action directe — aucune connexion requise · Token expire dans 72h</p>
          <div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px;">
            <a href="${approveUrl}" style="display:inline-block;background:linear-gradient(135deg,#009A00,#007A00);color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:bold;font-size:15px;">Approuver</a>
            <a href="${rejectUrl}" style="display:inline-block;background:linear-gradient(135deg,#EF2B2D,#C41E20);color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:bold;font-size:15px;">Refuser</a>
          </div>
          <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin:0;">
            Ou gérez depuis le <a href="${APP_URL}/admin/photos?statut=pending" style="color:#EFC031;text-decoration:none;">dashboard admin</a>
          </p>
        </div>
      `),
    })
  } catch (error) {
    console.error('Erreur envoi notification admin:', error)
  }
}

// ============================================================
// EMAIL DE BIENVENUE NEWSLETTER
// ============================================================

export async function sendWelcomeNewsletter(email: string, nom?: string): Promise<void> {
  try {
    const unsubscribeToken = await createUnsubscribeToken(email)
    const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`
    const safeNom = nom ? escapeHtml(nom) : ''

    await resend.emails.send({
      from: FROM_DISPLAY,
      to: email,
      subject: `Bienvenue sur BurkinaVista — La bibliothèque visuelle du Burkina Faso`,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: wrapEmail(`
        <div style="padding:36px 32px;">
          <h1 style="font-size:22px;font-weight:bold;color:#EFC031;margin:0 0 16px 0;">Bienvenue ${safeNom} !</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">
            Vous êtes maintenant abonné(e) à la newsletter de <strong style="color:#ffffff;">BurkinaVista</strong> — 
            la bibliothèque visuelle libre du Burkina Faso.
          </p>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.7;margin:0 0 32px 0;">
            Chaque semaine, recevez les nouvelles photos et vidéos authentiques du Burkina Faso 
            directement dans votre boîte mail.
          </p>
          <div style="text-align:center;">
            <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#EFC031,#C9A025);color:#000000;text-decoration:none;padding:13px 36px;border-radius:10px;font-weight:bold;font-size:15px;">Explorer BurkinaVista</a>
          </div>
        </div>
        <div style="text-align:center;padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.05);">
          <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.2);font-size:11px;text-decoration:underline;">Se désabonner</a>
        </div>
      `),
    })
  } catch (error) {
    console.error('Erreur envoi email bienvenue newsletter:', error)
  }
}

// ============================================================
// NEWSLETTER HEBDOMADAIRE
// ============================================================

export async function sendNewsletter(abonnes: Abonne[], medias: Media[]): Promise<void> {
  if (!abonnes.length || !medias.length) return

  const mediasToShow = medias.slice(0, 12)
  const mediasHtml = mediasToShow.map((media) => {
    const imgUrl = media.type === 'photo' ? media.cloudinary_url : media.thumbnail_url
    if (!imgUrl) return ''
    // [EMAIL-XSS] Échappement des champs interpolés
    const safeTitre = escapeHtml(media.titre)
    const safeAlt = escapeHtml(media.alt_text || media.titre)
    const safeCategorie = escapeHtml(media.categorie)
    const safeVille = escapeHtml(media.ville || '')
    const safeImgUrl = encodeURI(imgUrl)
    const safeSlug = encodeURIComponent(media.slug)
    return `
      <div style="width:48%;display:inline-block;vertical-align:top;margin-bottom:16px;padding:0 4px;box-sizing:border-box;">
        <a href="${APP_URL}/photos/${safeSlug}" style="text-decoration:none;">
          <img src="${safeImgUrl}" alt="${safeAlt}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;display:block;" />
          <p style="color:#ffffff;font-size:13px;font-weight:bold;margin:8px 0 2px 0;">${safeTitre}</p>
          <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">${safeCategorie}${safeVille ? ` · ${safeVille}` : ''}</p>
        </a>
      </div>
    `
  }).join('')

  for (const abonne of abonnes) {
    try {
      const unsubscribeToken = await createUnsubscribeToken(abonne.email)
      const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(abonne.email)}&token=${unsubscribeToken}`

      await resend.emails.send({
        from: FROM_DISPLAY,
        to: abonne.email,
        subject: `BurkinaVista — Les nouveautés de la semaine (${medias.length} média${medias.length > 1 ? 's' : ''})`,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        html: wrapEmail(`
          <div style="padding:32px 32px 0 32px;text-align:center;">
            <h1 style="font-size:20px;font-weight:bold;color:#EFC031;margin:0 0 6px 0;">Les nouveautés de la semaine</h1>
            <p style="color:rgba(255,255,255,0.35);font-size:13px;margin:0 0 28px 0;">
              ${medias.length} nouveau${medias.length > 1 ? 'x' : ''} média${medias.length > 1 ? 's' : ''} cette semaine
            </p>
          </div>
          <div style="padding:0 28px;">
            ${mediasHtml}
          </div>
          <div style="text-align:center;padding:24px 32px;">
            <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#EFC031,#C9A025);color:#000000;text-decoration:none;padding:13px 36px;border-radius:10px;font-weight:bold;font-size:15px;">Voir tous les médias</a>
          </div>
          <div style="text-align:center;padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">
              <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.2);text-decoration:underline;">Se désabonner</a>
            </p>
          </div>
        `),
      })

      // Petite pause pour éviter le rate limiting Resend
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Erreur envoi newsletter à ${abonne.email}:`, error)
    }
  }
}

// ============================================================
// CONFIRMATION APPROBATION
// ============================================================

export async function sendApprovalConfirmation(
  email: string,
  prenom: string,
  titre: string,
  slug: string
): Promise<void> {
  try {
    // [EMAIL-XSS] Échappement
    const safePrenom = escapeHtml(prenom)
    const safeTitre = escapeHtml(titre)
    const safeSlug = encodeURIComponent(slug)

    await resend.emails.send({
      from: FROM_DISPLAY,
      to: email,
      subject: `Votre média a été approuvé — BurkinaVista`,
      html: wrapEmail(`
        <div style="padding:36px 32px;">
          <h1 style="font-size:22px;font-weight:bold;color:#009A00;margin:0 0 16px 0;">Félicitations ${safePrenom} !</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 32px 0;">
            Votre média <strong style="color:#ffffff;">"${safeTitre}"</strong> a été approuvé et est maintenant 
            visible sur BurkinaVista.
          </p>
          <div style="text-align:center;">
            <a href="${APP_URL}/photos/${safeSlug}" style="display:inline-block;background:linear-gradient(135deg,#009A00,#007A00);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:bold;font-size:15px;">Voir mon média</a>
          </div>
        </div>
      `),
    })
  } catch (error) {
    console.error('Erreur envoi email approbation:', error)
  }
}
