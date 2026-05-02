# BurkinaVista — Bibliothèque Visuelle du Burkina Faso

## 🌍 URLs
- **Production**: https://burkina-vista.vercel.app
- **Email contact**: BurkinaVista@gmail.com

## 🔒 Audit sécurité 2026-05-01 — Status

47 corrections appliquées (9 critiques, 14 élevées, 17 modérées, 7 faibles).
Voir `RAPPORT_AUDIT.md` et `RAPPORT_CORRECTIONS.md` pour le détail complet.

**Variables d'environnement à configurer sur Vercel** (voir `.env.local.example`) :
- `ADMIN_PASSWORD_HASH` (généré via `node scripts/generate-admin-hash.mjs <pwd>`)
- `JWT_SECRET` (généré via `openssl rand -base64 32`)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate-limiting)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (captcha)
- `VIRUSTOTAL_API_KEY` (scan AV optionnel)

**Migrations à appliquer** sur Neon : `neon-migration.sql` (idempotent).

## ✅ Fonctionnalités implémentées

### Bilingue FR/EN (next-intl)
- Détection automatique de la langue du navigateur (Accept-Language)
- Bouton de switch FR ↔ EN dans la Navbar (desktop + mobile)
- Cookie `NEXT_LOCALE` persistant la préférence utilisateur
- Toutes les pages traduites : accueil, à propos, guide, contact, licences, CGU, confidentialité

### Thème Clair/Sombre (Dark/Light Mode)
- Toggle dans la Navbar (icône ☀️/🌙)
- Thème persisté dans `localStorage` (clé `bv-theme`)
- Variables CSS `data-theme="dark"` / `data-theme="light"`
- Compatible avec tous les composants existants
- Fond sombre → brun terreux africain (dark) / crème chaleureux (light)

### Page Contact (`/contact`)
- Formulaire complet : prénom, nom, email, sujet, type de demande, message
- Types : Plainte, Recommandation, Conseil, Litige, Signalement, Question générale, Autre
- Email envoyé à BurkinaVista@gmail.com via Resend
- Email de confirmation automatique à l'expéditeur
- Traduction complète FR/EN

### Email BurkinaVista@gmail.com
- Affiché dans le Footer (lien mailto)
- Affiché dans la page Contact
- Affiché dans les pages CGU, Confidentialité, Licences, À propos

### Animations enrichies
- `animate-fade-in-up` : entrée depuis le bas
- `animate-bounce-in` : rebond d'entrée
- `animate-gradient` : dégradé animé
- `animate-glow-red/green` : lueur colorée
- `animate-slide-left/right` : glissement latéral
- Classe `.page-enter` : transition sur chaque page
- Particules décoratives dans le Hero

### SEO bilingue
- Metadata dynamique FR/EN sur toutes les pages
- alternates canonical + hreflang
- sitemap.xml mis à jour avec `/contact`
- robots.ts propre
- OpenGraph + Twitter Cards

## 🗂️ Structure des fichiers modifiés/créés

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `messages/fr.json` | Toutes les traductions françaises |
| `messages/en.json` | Toutes les traductions anglaises |
| `i18n.ts` | Configuration next-intl |
| `context/ThemeContext.tsx` | Provider thème dark/light |
| `context/LocaleContext.tsx` | Provider langue FR/EN |
| `components/layout/Providers.tsx` | Wrapper client ThemeProvider + LocaleProvider |
| `app/contact/page.tsx` | Page contact (Server Component + SEO) |
| `app/contact/ContactClient.tsx` | Formulaire de contact (Client Component) |
| `app/api/contact/route.ts` | API route envoi email contact |

### Fichiers modifiés
| Fichier | Changements |
|---------|-------------|
| `app/layout.tsx` | next-intl, ThemeProvider, LocaleProvider |
| `app/globals.css` | Variables CSS dark/light, nouvelles animations |
| `tailwind.config.ts` | darkMode, nouvelles animations keyframes |
| `next.config.js` | withNextIntl plugin |
| `middleware.ts` | Admin JWT (inchangé fonctionnellement) |
| `components/layout/Navbar.tsx` | Boutons langue + thème, traductions |
| `components/layout/Footer.tsx` | Email contact, traductions |
| `components/photos/HeroSection.tsx` | Traductions + animations améliorées |
| `app/about/page.tsx` | SEO bilingue, traductions, animations |
| `app/guide/page.tsx` | SEO bilingue, traductions, animations |
| `app/confidentialite/page.tsx` | SEO bilingue, email contact, traductions |
| `app/cgu/page.tsx` | SEO bilingue, email contact, traductions |
| `app/licences/page.tsx` | SEO bilingue, email contact, traductions |
| `app/robots.ts` | Mis à jour |
| `app/sitemap.ts` | Ajout /contact, format amélioré |

## 🔧 Stack technique
- **Framework**: Next.js 14 (App Router)
- **Styles**: TailwindCSS + CSS Variables (dark/light)
- **i18n**: next-intl (detection navigateur + cookie)
- **Database**: Neon (PostgreSQL serverless)
- **Storage**: Cloudinary (photos) + Cloudflare Stream (vidéos)
- **Email**: Resend
- **AI**: Google Gemini (SEO auto)
- **Déploiement**: Vercel

## 🌱 Variables d'environnement requises
```env
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_STREAM_TOKEN=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@burkinavista.com
ADMIN_EMAIL=BurkinaVista@gmail.com
ADMIN_PASSWORD_HASH=...
JWT_SECRET=...
GEMINI_API_KEY=...
NEXT_PUBLIC_APP_URL=https://burkina-vista.vercel.app
CRON_SECRET=...
```

## 📦 Compatibilité
- ✅ Vercel (Edge Runtime compatible)
- ✅ Neon DB (@neondatabase/serverless)
- ✅ Next.js 14 App Router
- ✅ TypeScript strict
- ✅ Tailwind CSS v3
