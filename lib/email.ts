/**
 * lib/email.ts — Envoi d'emails avec Resend
 * Confirmation contributeur, notification admin, newsletter, bienvenue
 */
import { Resend } from 'resend'
import { createModerationToken, createUnsubscribeToken } from './auth'
import type { Media, Abonne } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

// Adresse technique réelle (domaine vérifié sur Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@burkinavista.poodasamuel.com'
// Nom affiché dans la boîte du destinataire
const FROM_DISPLAY = `NoreplyBurkinaVista <${FROM_EMAIL}>`

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

// Email admin interne (modération médias) → poodasamuelpro@gmail.com
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// ============================================================
// CONFIRMATION AU CONTRIBUTEUR
// ============================================================

/**
 * Envoie un email de confirmation au contributeur après upload
 */
export async function sendContributorConfirmation(
  email: string,
  prenom: string,
  titre: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: email,
      subject: '✅ Votre contribution a bien été reçue — BurkinaVista',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation — BurkinaVista</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-flex;align-items:center;gap:12px;">
        <svg width="40" height="27" viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="13.5" fill="#EF2B2D"/>
          <rect y="13.5" width="40" height="13.5" fill="#009A00"/>
          <polygon points="20,6 21.5,11 26,11 22.5,14 23.8,19 20,16 16.2,19 17.5,14 14,11 18.5,11" fill="#EFC031"/>
        </svg>
        <span style="font-size:24px;font-weight:bold;color:#ffffff;">BurkinaVista</span>
      </div>
    </div>

    <!-- Contenu -->
    <div style="background:#1A1A2E;border-radius:16px;padding:40px;border:1px solid rgba(239,192,49,0.2);">
      <h1 style="font-size:28px;font-weight:bold;color:#EFC031;margin:0 0 16px 0;">
        Merci ${prenom} ! 🎉
      </h1>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        Votre contribution <strong style="color:#ffffff;">"${titre}"</strong> a bien été reçue 
        et est en attente de validation par notre équipe.
      </p>
      <div style="background:rgba(239,192,49,0.1);border:1px solid rgba(239,192,49,0.3);border-radius:12px;padding:20px;margin:0 0 24px 0;">
        <p style="color:#EFC031;font-size:14px;margin:0 0 8px 0;font-weight:bold;">📋 Prochaines étapes :</p>
        <ul style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;padding-left:20px;line-height:2;">
          <li>Notre équipe examine votre média sous <strong>48h</strong></li>
          <li>Si approuvé, il sera publié sur BurkinaVista</li>
          <li>Vous recevrez un email de confirmation</li>
        </ul>
      </div>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">
        Merci de contribuer à valoriser le patrimoine visuel du Burkina Faso 🇧🇫
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="color:rgba(255,255,255,0.2);font-size:12px;">
        © ${new Date().getFullYear()} BurkinaVista — Fait avec ❤️ pour le Burkina Faso
      </p>
      <p style="color:rgba(255,255,255,0.2);font-size:12px;margin-top:8px;">
        <a href="${APP_URL}" style="color:#EFC031;text-decoration:none;">burkinavista.com</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })
  } catch (error) {
    console.error('Erreur envoi email confirmation contributeur:', error)
  }
}

// ============================================================
// NOTIFICATION ADMIN (nouveau média en attente)
// ============================================================

/**
 * Notifie l'admin d'un nouveau média en attente de modération
 * Inclut des boutons approve/reject avec tokens JWT (sans connexion requise)
 * → Envoyé à ADMIN_EMAIL (poodasamuelpro@gmail.com via .env)
 */
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

    // Générer les tokens de modération (expire 72h)
    const approveToken = await createModerationToken(media.id, 'approve')
    const rejectToken = await createModerationToken(media.id, 'reject')

    const approveUrl = `${APP_URL}/api/moderation?action=approve&id=${media.id}&token=${approveToken}`
    const rejectUrl = `${APP_URL}/api/moderation?action=reject&id=${media.id}&token=${rejectToken}`

    // Affichage image ou vidéo
    const mediaHtml = media.type === 'photo' && media.cloudinary_url
      ? `<img src="${media.cloudinary_url}" alt="${media.titre}" style="max-width:560px;width:100%;border-radius:12px;display:block;margin:0 auto;" />`
      : media.thumbnail_url
        ? `
          <div style="position:relative;display:inline-block;max-width:560px;width:100%;">
            <img src="${media.thumbnail_url}" alt="${media.titre}" style="max-width:100%;border-radius:12px;display:block;" />
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;background:rgba(0,0,0,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <span style="color:#EFC031;font-size:24px;">▶</span>
            </div>
          </div>
        `
        : `<div style="background:#1A1A2E;border-radius:12px;padding:40px;text-align:center;color:rgba(255,255,255,0.4);">Vidéo — pas de thumbnail disponible</div>`

    await resend.emails.send({
      from: FROM_DISPLAY,
      to: ADMIN_EMAIL,
      subject: `🔔 Nouveau média en attente — ${media.titre}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau média — BurkinaVista Admin</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:12px;">
        <svg width="40" height="27" viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="13.5" fill="#EF2B2D"/>
          <rect y="13.5" width="40" height="13.5" fill="#009A00"/>
          <polygon points="20,6 21.5,11 26,11 22.5,14 23.8,19 20,16 16.2,19 17.5,14 14,11 18.5,11" fill="#EFC031"/>
        </svg>
        <span style="font-size:24px;font-weight:bold;color:#ffffff;">BurkinaVista</span>
      </div>
      <p style="color:rgba(255,255,255,0.4);font-size:14px;margin-top:8px;">Administration — Nouveau média en attente</p>
    </div>

    <!-- Image/Vidéo -->
    <div style="margin-bottom:24px;text-align:center;">
      ${mediaHtml}
    </div>

    <!-- Infos média -->
    <div style="background:#1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.1);">
      <h2 style="font-size:20px;font-weight:bold;color:#ffffff;margin:0 0 16px 0;">${media.titre}</h2>
      
      ${media.description ? `<p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0 0 16px 0;">${media.description}</p>` : ''}
      
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:13px;width:40%;">Type</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;">${media.type === 'video' ? '🎥 Vidéo' : '📷 Photo'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:13px;">Catégorie</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#EFC031;font-size:13px;">${media.categorie}</td>
        </tr>
        ${media.ville ? `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:13px;">Ville</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;">📍 ${media.ville}${media.region ? `, ${media.region}` : ''}</td></tr>` : ''}
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:13px;">Licence</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;">${media.licence}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:13px;">Date upload</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffffff;font-size:13px;">${new Date(media.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      </table>
    </div>

    <!-- Infos contributeur -->
    <div style="background:#1A1A2E;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid rgba(0,154,0,0.2);">
      <h3 style="font-size:14px;font-weight:bold;color:#009A00;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.05em;">👤 Contributeur</h3>
      <p style="color:#ffffff;font-size:16px;font-weight:bold;margin:0 0 8px 0;">
        ${media.contributeur_prenom || ''} ${media.contributeur_nom || ''}
      </p>
      ${media.contributeur_email ? `<p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 4px 0;">📧 ${media.contributeur_email}</p>` : ''}
      ${media.contributeur_tel ? `<p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">📱 ${media.contributeur_tel}</p>` : ''}
    </div>

    <!-- Boutons d'action (SANS connexion requise) -->
    <div style="background:#1A1A2E;border-radius:16px;padding:24px;border:1px solid rgba(239,43,45,0.2);">
      <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 20px 0;text-align:center;">
        ⚡ Action directe — aucune connexion requise · Token expire dans 72h
      </p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <a href="${approveUrl}" style="display:inline-block;background:linear-gradient(135deg,#009A00,#007A00);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:16px;text-align:center;">
          ✅ APPROUVER
        </a>
        <a href="${rejectUrl}" style="display:inline-block;background:linear-gradient(135deg,#EF2B2D,#C41E20);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:16px;text-align:center;">
          ❌ REFUSER
        </a>
      </div>
      <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:16px 0 0 0;text-align:center;">
        Ou gérez les médias depuis le <a href="${APP_URL}/admin/photos?statut=pending" style="color:#EFC031;text-decoration:none;">dashboard admin</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="color:rgba(255,255,255,0.2);font-size:12px;">
        © ${new Date().getFullYear()} BurkinaVista
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })
  } catch (error) {
    console.error('Erreur envoi notification admin:', error)
  }
}

// ============================================================
// EMAIL DE BIENVENUE NEWSLETTER
// ============================================================

/**
 * Envoie un email de bienvenue aux nouveaux abonnés newsletter
 */
export async function sendWelcomeNewsletter(email: string, nom?: string): Promise<void> {
  try {
    const unsubscribeToken = await createUnsubscribeToken(email)
    const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`

    await resend.emails.send({
      from: FROM_DISPLAY,
      to: email,
      subject: '🇧🇫 Bienvenue sur BurkinaVista !',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:12px;">
        <svg width="40" height="27" viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="13.5" fill="#EF2B2D"/>
          <rect y="13.5" width="40" height="13.5" fill="#009A00"/>
          <polygon points="20,6 21.5,11 26,11 22.5,14 23.8,19 20,16 16.2,19 17.5,14 14,11 18.5,11" fill="#EFC031"/>
        </svg>
        <span style="font-size:24px;font-weight:bold;color:#ffffff;">BurkinaVista</span>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#EF2B2D,#EFC031,#009A00);border-radius:2px;margin:0 auto;width:200px;"></div>
    </div>

    <!-- Contenu -->
    <div style="background:#1A1A2E;border-radius:16px;padding:40px;border:1px solid rgba(239,192,49,0.2);">
      <h1 style="font-size:28px;font-weight:bold;color:#EFC031;margin:0 0 16px 0;">
        Bienvenue ${nom ? nom : ''}! 🎉
      </h1>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        Vous êtes maintenant abonné(e) à la newsletter de <strong style="color:#ffffff;">BurkinaVista</strong> — 
        la bibliothèque visuelle libre du Burkina Faso.
      </p>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Chaque semaine, recevez les nouvelles photos et vidéos authentiques du Burkina Faso, 
        directement dans votre boîte mail.
      </p>
      <div style="text-align:center;margin-top:32px;">
        <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#EFC031,#C9A025);color:#000000;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:bold;font-size:16px;">
          🇧🇫 Explorer BurkinaVista
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="color:rgba(255,255,255,0.2);font-size:12px;">
        © ${new Date().getFullYear()} BurkinaVista — 
        <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.3);text-decoration:none;">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })
  } catch (error) {
    console.error('Erreur envoi email bienvenue newsletter:', error)
  }
}

// ============================================================
// NEWSLETTER HEBDOMADAIRE
// ============================================================

/**
 * Envoie la newsletter hebdomadaire aux abonnés actifs
 */
export async function sendNewsletter(abonnes: Abonne[], medias: Media[]): Promise<void> {
  if (!abonnes.length || !medias.length) return

  // Générer la grille des médias (max 12)
  const mediasToShow = medias.slice(0, 12)
  const mediasHtml = mediasToShow.map((media) => {
    const imgUrl = media.type === 'photo' ? media.cloudinary_url : media.thumbnail_url
    return imgUrl ? `
      <div style="width:48%;display:inline-block;vertical-align:top;margin-bottom:16px;padding:0 4px;box-sizing:border-box;">
        <a href="${APP_URL}/photos/${media.slug}" style="text-decoration:none;">
          <img src="${imgUrl}" alt="${media.alt_text || media.titre}" style="width:100%;height:160px;object-fit:cover;border-radius:10px;display:block;" />
          <p style="color:#ffffff;font-size:13px;font-weight:bold;margin:8px 0 2px 0;line-clamp:2;">${media.titre}</p>
          <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0;">${media.categorie}${media.ville ? ` · ${media.ville}` : ''}</p>
        </a>
      </div>
    ` : ''
  }).join('')

  // Envoi individuel avec token de désabonnement personnalisé
  for (const abonne of abonnes) {
    try {
      const unsubscribeToken = await createUnsubscribeToken(abonne.email)
      const unsubscribeUrl = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(abonne.email)}&token=${unsubscribeToken}`

      await resend.emails.send({
        from: FROM_DISPLAY,
        to: abonne.email,
        subject: `🇧🇫 Les nouveautés BurkinaVista de la semaine`,
        html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:12px;">
        <svg width="40" height="27" viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="13.5" fill="#EF2B2D"/>
          <rect y="13.5" width="40" height="13.5" fill="#009A00"/>
          <polygon points="20,6 21.5,11 26,11 22.5,14 23.8,19 20,16 16.2,19 17.5,14 14,11 18.5,11" fill="#EFC031"/>
        </svg>
        <span style="font-size:24px;font-weight:bold;color:#ffffff;">BurkinaVista</span>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#EF2B2D,#EFC031,#009A00);border-radius:2px;margin:0 auto;width:200px;"></div>
      <h1 style="font-size:22px;font-weight:bold;color:#EFC031;margin:20px 0 4px 0;">Les nouveautés de la semaine 🇧🇫</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">${medias.length} nouveau${medias.length > 1 ? 'x' : ''} média${medias.length > 1 ? 's' : ''}</p>
    </div>

    <!-- Grille médias -->
    <div style="margin-bottom:32px;">
      ${mediasHtml}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:40px;">
      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#EFC031,#C9A025);color:#000000;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:bold;font-size:16px;">
        Voir tous les médias →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
        © ${new Date().getFullYear()} BurkinaVista — La bibliothèque visuelle libre du Burkina Faso
      </p>
      <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:8px;">
        <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
      })
      // Petite pause pour éviter le rate limiting Resend
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Erreur envoi newsletter à ${abonne.email}:`, error)
    }
  }
}

/**
 * Envoie un email de confirmation d'approbation au contributeur
 */
export async function sendApprovalConfirmation(
  email: string,
  prenom: string,
  titre: string,
  slug: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_DISPLAY,
      to: email,
      subject: '🎉 Votre média a été approuvé — BurkinaVista',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <svg width="40" height="27" viewBox="0 0 40 27" fill="none">
        <rect width="40" height="13.5" fill="#EF2B2D"/>
        <rect y="13.5" width="40" height="13.5" fill="#009A00"/>
        <polygon points="20,6 21.5,11 26,11 22.5,14 23.8,19 20,16 16.2,19 17.5,14 14,11 18.5,11" fill="#EFC031"/>
      </svg>
      <p style="color:#EFC031;font-size:14px;margin-top:8px;">BurkinaVista</p>
    </div>
    <div style="background:#1A1A2E;border-radius:16px;padding:40px;border:1px solid rgba(0,154,0,0.3);">
      <h1 style="color:#009A00;font-size:28px;margin:0 0 16px 0;">🎉 Félicitations ${prenom} !</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        Votre média <strong style="color:#ffffff;">"${titre}"</strong> a été approuvé et est maintenant 
        visible sur BurkinaVista !
      </p>
      <div style="text-align:center;">
        <a href="${APP_URL}/photos/${slug}" style="display:inline-block;background:linear-gradient(135deg,#009A00,#007A00);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:16px;">
          Voir mon média →
        </a>
      </div>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:12px;margin-top:24px;">
      © ${new Date().getFullYear()} BurkinaVista
    </p>
  </div>
</body>
</html>
      `,
    })
  } catch (error) {
    console.error('Erreur envoi email approbation:', error)
  }
}
