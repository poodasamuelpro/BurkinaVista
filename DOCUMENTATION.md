# 📖 BurkinaVista — Documentation Technique Complète

> **Dernière mise à jour :** Avril 2025  
> **Version :** 1.0  
> **Auteur :** Documentation générée automatiquement lors du refactoring

---

## 📌 Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Architecture & structure des fichiers](#3-architecture--structure-des-fichiers)
4. [Variables d'environnement — Configuration Admin](#4-variables-denvironnement--configuration-admin)
5. [Base de données Neon (PostgreSQL)](#5-base-de-données-neon-postgresql)
6. [Cloudinary — Stockage des photos](#6-cloudinary--stockage-des-photos)
7. [Cloudflare Stream — Stockage des vidéos](#7-cloudflare-stream--stockage-des-vidéos)
8. [Gemini AI — Génération SEO automatique](#8-gemini-ai--génération-seo-automatique)
9. [Resend — Envoi d'emails](#9-resend--envoi-demails)
10. [Système d'authentification Admin](#10-système-dauthentification-admin)
11. [Internationalisation (FR/EN)](#11-internationalisation-fren)
12. [Thème Clair / Sombre](#12-thème-clair--sombre)
13. [Fonctionnement de l'Upload](#13-fonctionnement-de-lupload)
14. [Modération des médias](#14-modération-des-médias)
15. [Newsletter](#15-newsletter)
16. [Panel d'administration](#16-panel-dadministration)
17. [SEO & Sitemap](#17-seo--sitemap)
18. [Composants UI clés](#18-composants-ui-clés)
19. [Déploiement Vercel](#19-déploiement-vercel)
20. [Modifications apportées (Refactoring)](#20-modifications-apportées-refactoring)

---

## 1. Vue d'ensemble du projet

**BurkinaVista** est une bibliothèque visuelle libre et collaborative dédiée au Burkina Faso.  
Mission : permettre aux Burkinabè de partager des photos et vidéos authentiques, libres de droits, pour contrer les représentations biaisées du pays dans les médias internationaux.

**Fonctionnalités principales :**
- 📸 Galerie de photos et vidéos du Burkina Faso avec filtrage par catégorie, ville, type
- 📤 Upload libre sans compte — contributions de n'importe qui
- 🤖 Génération automatique de métadonnées SEO via Google Gemini AI
- ✅ Workflow de modération admin (approbation/rejet depuis l'email ou le panel)
- 📧 Newsletter hebdomadaire avec envoi automatique des nouveaux médias
- 🌐 Bilingue Français / Anglais
- 🌙 Mode sombre / clair
- 📱 100% responsive (mobile, tablette, desktop)

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | **Next.js** | 14.1.0 |
| Langage | **TypeScript** | ^5 |
| Style | **TailwindCSS** | ^3.3 |
| Animations | **Framer Motion** | ^11 |
| Icônes | **Lucide React** | ^0.344 |
| Internationalisation | **next-intl** | ^4.9 |
| Base de données | **Neon PostgreSQL** (serverless) | ^0.9 |
| Stockage photos | **Cloudinary** | ^2 |
| Stockage vidéos | **Cloudflare Stream** | API REST |
| IA SEO | **Google Gemini** (@google/generative-ai) | ^0.21 |
| Email | **Resend** | ^3.2 |
| Authentification | **JWT via jose** | ^5.6 |
| Upload fichiers | **react-dropzone** | ^14 |
| Notifications | **react-hot-toast** | ^2.4 |
| Déploiement | **Vercel** | — |
| URL Prod | `https://burkina-vista.vercel.app` | — |

---

## 3. Architecture & structure des fichiers

```
BurkinaVista/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout racine (fonts, Navbar, Footer, Toaster, FloatingLangSwitcher)
│   ├── page.tsx                  # Page d'accueil (galerie + héro + stats)
│   ├── globals.css               # Styles globaux, variables CSS, animations
│   ├── robots.ts                 # Robots.txt dynamique
│   ├── sitemap.ts                # Sitemap XML dynamique
│   │
│   ├── about/page.tsx            # Page À propos
│   ├── categories/page.tsx       # Liste des catégories
│   ├── contact/page.tsx          # Formulaire de contact
│   ├── cgu/page.tsx              # Conditions Générales d'Utilisation
│   ├── confidentialite/page.tsx  # Politique de confidentialité
│   ├── guide/page.tsx            # Guide du contributeur
│   ├── licences/page.tsx         # Licences Creative Commons
│   ├── photos/[slug]/page.tsx    # Page détail d'un média
│   ├── upload/page.tsx           # Formulaire d'upload (contribution)
│   │
│   ├── admin/
│   │   ├── layout.tsx            # Layout admin (vérification JWT)
│   │   ├── page.tsx              # Dashboard admin principal
│   │   ├── login/page.tsx        # Connexion admin
│   │   ├── photos/page.tsx       # Gestion médias (approbation/rejet)
│   │   ├── categories/page.tsx   # Gestion catégories
│   │   ├── contributeurs/page.tsx# Liste contributeurs
│   │   ├── abonnes/page.tsx      # Gestion abonnés newsletter
│   │   └── newsletter/page.tsx   # Envoi newsletter
│   │
│   └── api/
│       ├── upload/route.ts       # POST /api/upload — Upload médias
│       ├── contact/route.ts      # POST /api/contact — Envoi message contact
│       ├── newsletter/
│       │   └── subscribe/route.ts# POST /api/newsletter/subscribe
│       ├── admin/route.ts        # GET /api/admin — Stats + gestion
│       ├── admin-login/route.ts  # POST /api/admin-login — Auth
│       ├── admin-logout/route.ts # POST /api/admin-logout — Déconnexion
│       ├── moderation/route.ts   # POST /api/moderation — Approuver/Rejeter
│       ├── download/route.ts     # GET /api/download — Téléchargement
│       └── cron/route.ts         # GET /api/cron — Newsletter automatique
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Barre de navigation responsive (refactorisée)
│   │   ├── Footer.tsx            # Pied de page avec newsletter inline
│   │   └── Providers.tsx         # ThemeProvider + LocaleProvider
│   │
│   ├── ui/
│   │   ├── FasoLogo.tsx          # Logo SVG BurkinaVista + drapeau
│   │   └── FloatingLangSwitcher.tsx # ✨ Bouton flottant FR/EN (NOUVEAU)
│   │
│   ├── photos/
│   │   ├── HeroSection.tsx       # Section héro avec carousel médias
│   │   ├── PhotoGrid.tsx         # Grille masonry de médias
│   │   ├── PhotoCard.tsx         # Carte individuelle photo/vidéo
│   │   ├── CategoriesBar.tsx     # Barre de filtrage par catégorie
│   │   └── StatsBar.tsx          # Barre de statistiques
│   │
│   └── admin/
│       ├── AdminNav.tsx          # Navigation du panel admin
│       ├── MediaCard.tsx         # Carte de modération
│       └── StatsCard.tsx         # Carte statistique admin
│
├── context/
│   ├── ThemeContext.tsx           # Contexte thème clair/sombre (localStorage)
│   └── LocaleContext.tsx         # Contexte langue FR/EN (cookie NEXT_LOCALE)
│
├── lib/
│   ├── db.ts                     # Client Neon PostgreSQL (query, queryOne, queryMany)
│   ├── cloudinary.ts             # Fonctions upload Cloudinary
│   ├── ai-seo.ts                 # Génération SEO via Gemini AI
│   ├── auth.ts                   # Tokens JWT (admin, modération, newsletter)
│   └── email.ts                  # Templates et envoi emails via Resend
│
├── types/index.ts                # Types TypeScript (Media, Contributeur, etc.)
├── messages/
│   ├── fr.json                   # Traductions françaises
│   └── en.json                   # Traductions anglaises
│
├── i18n.ts                       # Configuration next-intl (détection locale)
├── middleware.ts                 # Protection routes admin + cookie locale
├── neon-migration.sql            # Script SQL création des tables
├── next.config.js                # Config Next.js (images Cloudinary, headers CSP)
├── tailwind.config.ts            # Config Tailwind + couleurs Faso
├── vercel.json                   # Config Vercel (cron jobs)
└── .env.local.example            # Exemple de variables d'environnement
```

---

## 4. Variables d'environnement — Configuration Admin

> ⚠️ **CRITIQUE** : Ces variables doivent être configurées dans Vercel → Settings → Environment Variables

Créer un fichier `.env.local` (pour le développement local) en copiant `.env.local.example` :

```bash
cp .env.local.example .env.local
```

### Variables requises et leur rôle

| Variable | Obligatoire | Service | Description |
|----------|-------------|---------|-------------|
| `DATABASE_URL` | ✅ Oui | Neon | URL de connexion PostgreSQL |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ Oui | Cloudinary | Nom du cloud Cloudinary (public) |
| `CLOUDINARY_API_KEY` | ✅ Oui | Cloudinary | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | ✅ Oui | Cloudinary | Secret API Cloudinary |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Oui (vidéos) | Cloudflare Stream | ID compte Cloudflare |
| `CLOUDFLARE_STREAM_API_TOKEN` | ✅ Oui (vidéos) | Cloudflare Stream | Token API Stream |
| `GEMINI_API_KEY` | ✅ Oui | Google Gemini | Clé API Gemini IA |
| `RESEND_API_KEY` | ✅ Oui | Resend | Clé API envoi emails |
| `RESEND_FROM_EMAIL` | ✅ Oui | Resend | Email expéditeur (ex: `noreply@burkinavista.com`) |
| `ADMIN_PASSWORD` | ✅ Oui | Auth admin | Mot de passe connexion admin |
| `ADMIN_EMAIL` | ✅ Oui | Auth admin | Email admin pour les notifications |
| `JWT_SECRET` | ✅ Oui | Auth JWT | Secret de signature JWT (32+ caractères aléatoires) |
| `NEXT_PUBLIC_APP_URL` | ✅ Oui | Général | URL publique de l'app (ex: `https://burkina-vista.vercel.app`) |

---

## 5. Base de données Neon (PostgreSQL)

### Obtenir la clé DATABASE_URL

1. Aller sur **[neon.tech](https://neon.tech)**
2. Créer un compte gratuit
3. Créer un nouveau projet
4. Copier la **Connection String** (`postgres://user:password@host/dbname?sslmode=require`)
5. Coller dans `DATABASE_URL`

### Initialiser la base de données

```bash
# Appliquer le script de migration
psql $DATABASE_URL -f neon-migration.sql
```

Ou depuis Neon Dashboard → SQL Editor, copier-coller le contenu de `neon-migration.sql`.

### Schéma des tables principales

**Table `medias`**
```sql
id, type (photo|video), cloudinary_url, cloudinary_public_id, width, height,
stream_url, stream_id, thumbnail_url, duration,
slug, titre, description, alt_text, tags[], categorie,
ville, region,
contributeur_nom, contributeur_prenom, contributeur_email, contributeur_tel,
licence (CC0|CC BY|CC BY-NC|CC BY-SA), downloads, views,
statut (pending|approved|rejected), rejection_reason,
created_at, updated_at
```

**Table `contributeurs`**
```sql
id, prenom, nom, email, tel, medias_count, created_at
```

**Table `categories`**
```sql
id, nom, slug, description, cover_url, count
```

**Table `abonnes`** (newsletter)
```sql
id, email, nom, actif, created_at
```

### Client DB (`lib/db.ts`)

```typescript
import { query, queryOne, queryMany } from '@/lib/db'

// Plusieurs résultats
const medias = await queryMany<Media>('SELECT * FROM medias WHERE statut = $1', ['approved'])

// Un seul résultat
const media = await queryOne<Media>('SELECT * FROM medias WHERE slug = $1', [slug])

// Insert/Update/Delete
await query('UPDATE medias SET statut = $1 WHERE id = $2', ['approved', id])
```

---

## 6. Cloudinary — Stockage des photos

### Obtenir les clés Cloudinary

1. Aller sur **[cloudinary.com](https://cloudinary.com)**
2. Créer un compte gratuit (plan gratuit = 25 GB stockage)
3. Dashboard → **API Keys**
4. Copier :
   - `Cloud Name` → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`

### Utilisation dans le code

Toutes les photos sont uploadées dans le dossier `burkinavista/photos` de Cloudinary.  
Le fichier `lib/cloudinary.ts` gère l'upload et retourne `{ url, public_id, width, height }`.

### Transformations d'images

Cloudinary permet des transformations via URL :
```
https://res.cloudinary.com/{cloud_name}/image/upload/w_800,f_auto,q_auto/{public_id}
```
- `w_800` = largeur 800px
- `f_auto` = format auto (WebP si supporté)
- `q_auto` = qualité automatique

---

## 7. Cloudflare Stream — Stockage des vidéos

### Obtenir les clés Cloudflare Stream

1. Aller sur **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. Sélectionner votre compte → **Stream**
3. **Account ID** = visible dans la sidebar URL ou Overview
4. Créer un **API Token** : Profile → API Tokens → Create Token
   - Template : "Stream" ou permissions manuelles `stream:edit`
5. Copier :
   - Account ID → `CLOUDFLARE_ACCOUNT_ID`
   - Token → `CLOUDFLARE_STREAM_API_TOKEN`

### Fonctionnement

Les vidéos sont uploadées via l'API REST Cloudflare Stream :
- Upload : `POST /accounts/{account_id}/stream`
- Lecture : HLS stream `https://customer-{account_id}.cloudflarestream.com/{uid}/manifest/video.m3u8`
- Thumbnail : `https://customer-{account_id}.cloudflarestream.com/{uid}/thumbnails/thumbnail.jpg`

---

## 8. Gemini AI — Génération SEO automatique

### Obtenir la clé Gemini

1. Aller sur **[aistudio.google.com](https://aistudio.google.com)**
2. Créer une clé API (gratuit — 60 req/min)
3. Copier la clé → `GEMINI_API_KEY`

### Ce que fait l'IA

Le fichier `lib/ai-seo.ts` génère automatiquement, pour chaque média uploadé :
- **Titre** : titre descriptif optimisé SEO (ex: "Marché de Gounghin, Ouagadougou")
- **Description** : description de 2-3 phrases pour Google
- **Alt text** : texte alternatif pour l'accessibilité
- **Tags** : 5-8 mots-clés pertinents
- **Slug** : URL propre (ex: `marche-gounghin-ouagadougou`)

Pour les **photos** : l'IA analyse l'image via Gemini Vision.  
Pour les **vidéos** : l'IA génère depuis les métadonnées textuelles.

---

## 9. Resend — Envoi d'emails

### Obtenir la clé Resend

1. Aller sur **[resend.com](https://resend.com)**
2. Créer un compte (plan gratuit = 3000 emails/mois)
3. Dashboard → **API Keys** → Create API Key
4. **Vérifier un domaine** si vous voulez envoyer depuis `@burkinavista.com`
   - Ajouter les enregistrements DNS fournis par Resend
   - Ou utiliser `onboarding@resend.dev` pour les tests
5. Copier :
   - API Key → `RESEND_API_KEY`
   - Email expéditeur vérifié → `RESEND_FROM_EMAIL`

### Emails envoyés automatiquement

| Déclencheur | Destinataire | Contenu |
|-------------|--------------|---------|
| Nouveau upload | Contributeur | Email de confirmation avec détails du média |
| Nouveau upload | Admin (`ADMIN_EMAIL`) | Notification avec boutons Approuver/Rejeter |
| Approbation média | Contributeur | Email "Votre média est en ligne" |
| Rejet média | Contributeur | Email "Votre média n'a pas été retenu" + raison |
| Désabonnement | Abonné | Confirmation désabonnement |
| Newsletter | Tous abonnés actifs | Nouveaux médias de la semaine |

---

## 10. Système d'authentification Admin

### Accès admin

- URL : `/admin/login`
- Credentials : `ADMIN_EMAIL` + `ADMIN_PASSWORD` (définis dans `.env.local`)
- Pas d'OAuth, pas de base utilisateurs — **login unique** via variables d'environnement

### Fonctionnement JWT

```
Login → POST /api/admin-login
    → Vérifie email/password vs variables d'environnement
    → Génère un JWT signé (expires 24h)
    → Stocke dans cookie `admin_token` (httpOnly, Secure)
    → Redirige vers /admin
```

Le middleware `middleware.ts` vérifie le cookie sur chaque requête `/admin/*`.

### JWT_SECRET

Générer une clé secrète forte :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copier le résultat → `JWT_SECRET`

### Tokens de modération

L'admin reçoit un email par contribution. Cet email contient des **liens directs** avec un token JWT :
- `Approuver` → `GET /api/moderation?token=xxx&action=approve`
- `Rejeter` → `GET /api/moderation?token=xxx&action=reject`

Ces tokens expirent après **72 heures**.

---

## 11. Internationalisation (FR/EN)

### Architecture i18n

- **Library** : `next-intl` ^4.9
- **Fichiers de traduction** : `messages/fr.json` et `messages/en.json`
- **Configuration** : `i18n.ts` — détecte la langue via :
  1. Cookie `NEXT_LOCALE` (prioritaire — défini lors du switch manuel)
  2. Header `Accept-Language` du navigateur

### Ajouter une traduction

Dans `messages/fr.json` et `messages/en.json` :
```json
{
  "ma_section": {
    "ma_cle": "Ma valeur française",
    "ma_cle": "My English value"
  }
}
```

Utiliser dans un composant :
```typescript
import { useTranslations } from 'next-intl'
const t = useTranslations('ma_section')
// t('ma_cle')
```

### ✨ FloatingLangSwitcher (NOUVEAU)

Composant flottant visible sur **toutes les pages** en bas à gauche de l'écran.  
Remplace l'ancien bouton FR/EN du header (supprimé pour libérer de l'espace).  
Fichier : `components/ui/FloatingLangSwitcher.tsx`

---

## 12. Thème Clair / Sombre

### Fonctionnement

- **ThemeContext** (`context/ThemeContext.tsx`) gère le thème
- Persistance via `localStorage` (clé `bv-theme`)
- Applique `data-theme="dark"` ou `data-theme="light"` sur `<html>`
- Défaut : **mode sombre**

### Couleurs

Définies dans `app/globals.css` via variables CSS :

| Variable | Mode sombre | Mode clair |
|----------|-------------|------------|
| `--faso-night` (fond principal) | `#0D0905` | **`#E8EDF2`** ✨ |
| `--faso-dusk` (fond secondaire) | `#1A1410` | **`#DDE3EA`** ✨ |
| `--faso-card` (fond cartes) | `#1C1610` | `#FFFFFF` |
| `--faso-red` | `#EF2B2D` | `#EF2B2D` |
| `--faso-gold` | `#EFC031` | `#EFC031` |
| `--faso-green` | `#009A00` | `#009A00` |

> ✨ **Modification Avril 2025** : Le fond clair est passé de `#F5F0E8` (beige chaud) à `#E8EDF2` (gris-bleu ardoise doux), pour un meilleur contraste avec les boutons et couleurs nationales.

### Toggle thème

- **Desktop** : Bouton Lune/Soleil dans la navbar
- **Mobile** : Option dans le menu burger

---

## 13. Fonctionnement de l'Upload

### Flux complet d'un upload

```
Utilisateur remplit le formulaire /upload
    ↓
POST /api/upload (FormData)
    ↓
Validation des champs obligatoires
(prenom, nom, email, fichier, categorie)
    ↓
Si photo (image/*):
    → uploadToCloudinary(buffer, 'burkinavista/photos')
    → generateSEOFromImage(url, userInput) via Gemini Vision
Si vidéo:
    → uploadToCloudflareStream(arrayBuffer, filename)
    → generateSEOFromText(userInput) via Gemini Text
    ↓
INSERT dans table `medias` avec statut = 'pending'
    ↓
upsertContributeur() (crée ou incrémente)
    ↓
Envoi parallèle des emails:
    - sendContributorConfirmation() → contributeur
    - sendAdminNotification() → ADMIN_EMAIL
    ↓
pingGoogle() → actualise le sitemap indexé
    ↓
Réponse JSON { success: true, media: {...} }
```

### Champs du formulaire

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Prénom contributeur | ✅ | |
| Nom contributeur | ✅ | |
| Email contributeur | ✅ | Pour la confirmation |
| Téléphone | ❌ | Optionnel |
| Fichier | ✅ | Photo (JPG/PNG/WebP) ou Vidéo (MP4) |
| Catégorie | ✅ | Choisir dans la liste |
| Titre | ❌ | L'IA génère un titre si absent |
| Description | ❌ | L'IA génère une description si absente |
| Ville | ❌ | Utilisé pour le SEO |
| Région | ❌ | |
| Tags | ❌ | Séparés par des virgules |
| Licence | ✅ | CC BY, CC0, CC BY-NC, CC BY-SA |

---

## 14. Modération des médias

### Via email (recommandé)

À chaque nouveau upload, l'admin reçoit un email contenant :
- Aperçu du média
- Informations du contributeur
- Bouton **Approuver** (lien direct avec token JWT)
- Bouton **Rejeter** (lien direct avec token JWT)

Cliquer sur le lien exécute automatiquement l'action.

### Via le panel admin

URL : `/admin/photos`

Actions disponibles :
- Voir tous les médias en attente (`statut = 'pending'`)
- Approuver → `statut = 'approved'` + email au contributeur
- Rejeter avec raison → `statut = 'rejected'` + email au contributeur
- Supprimer définitivement (supprime aussi de Cloudinary/Stream)

---

## 15. Newsletter

### Abonnement

- Formulaire dans le footer (prénom + email)
- Endpoint : `POST /api/newsletter/subscribe`
- Stocké dans table `abonnes` avec `actif = true`

### Désabonnement

- Lien dans chaque email newsletter (token JWT 30 jours)
- Endpoint : `GET /api/newsletter/unsubscribe?token=xxx`
- Met `actif = false` pour l'abonné

### Envoi automatique

- Déclenché par **cron Vercel** (configuré dans `vercel.json`)
- Fréquence : hebdomadaire (configurable dans `vercel.json`)
- Endpoint : `GET /api/cron`
- Envoie les nouveaux médias approuvés de la semaine à tous les `actif = true`

### Envoi manuel

Depuis le panel admin → `/admin/newsletter` → Bouton "Envoyer la newsletter"

---

## 16. Panel d'administration

URL d'accès : `/admin/login`  
Credentials : `ADMIN_EMAIL` + `ADMIN_PASSWORD`

### Pages disponibles

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/admin` | Statistiques générales |
| Médias | `/admin/photos` | Modération photos/vidéos |
| Catégories | `/admin/categories` | Créer/modifier/supprimer |
| Contributeurs | `/admin/contributeurs` | Liste des contributeurs |
| Abonnés | `/admin/abonnes` | Gestion newsletter |
| Newsletter | `/admin/newsletter` | Envoi manuel |

### Statistiques disponibles

- Nombre total de médias (photos/vidéos)
- Médias en attente de modération
- Nombre de contributeurs
- Nombre d'abonnés actifs
- Total téléchargements et vues

---

## 17. SEO & Sitemap

### Sitemap dynamique

Fichier `app/sitemap.ts` génère automatiquement :
- Page d'accueil
- Pages statiques (about, guide, contact, etc.)
- Page de chaque média approuvé (avec `lastmod` et priorité)

URL : `https://burkina-vista.vercel.app/sitemap.xml`

### Google Ping

À chaque nouveau média approuvé, un ping automatique est envoyé :
```
https://www.google.com/ping?sitemap=https://burkina-vista.vercel.app/sitemap.xml
```

### Robots.txt

Fichier `app/robots.ts` — autorise tous les robots sauf le dossier `/admin`.

---

## 18. Composants UI clés

### FasoLogo (`components/ui/FasoLogo.tsx`)

Logo SVG composite avec :
- Étoile burkinabè
- Couleurs du drapeau (rouge, or, vert)
- Texte "BurkinaVista" stylisé
- Props : `size`, `showName`

### FloatingLangSwitcher (`components/ui/FloatingLangSwitcher.tsx`) ✨ NOUVEAU

Bouton flottant en **bas à gauche** de l'écran :
- Affiche `🇬🇧 EN` si la langue courante est FR
- Affiche `🇫🇷 FR` si la langue courante est EN
- Tooltip au survol
- Adapté mode clair/sombre
- Animation au hover (scale 110%)

### Navbar (`components/layout/Navbar.tsx`) ✨ REFACTORISÉE

Comportement responsive :
| Breakpoint | Affichage |
|------------|-----------|
| Mobile (`< md`) | Logo + Recherche + Thème + Contribuer + Burger |
| Desktop (`md+`) | Logo + Liens centrés + Recherche + Thème + Contribuer |

Menu burger (mobile/tablette) :
- Accueil, Explorer
- À propos, Guide, Contact
- Toggle thème
- ❌ PAS de doublon "Contribuer" (déjà dans la barre)
- ❌ PAS de switch langue (FloatingLangSwitcher)

---

## 19. Déploiement Vercel

### Prérequis

1. Compte Vercel connecté au repo GitHub
2. Variables d'environnement configurées dans Vercel

### Configuration dans Vercel

```
Settings → Environment Variables
```
Ajouter toutes les variables listées dans la [Section 4](#4-variables-denvironnement--configuration-admin).

### Cron Jobs

Fichier `vercel.json` :
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 9 * * 1"
    }
  ]
}
```
Déclenche la newsletter automatique chaque **lundi à 9h UTC**.

### Commandes de déploiement

```bash
# Développement local
npm run dev

# Build de production (vérification avant déploiement)
npm run build

# Le déploiement se fait automatiquement via GitHub → Vercel CI/CD
```

---

## 20. Modifications apportées (Refactoring Avril 2025)

### ✅ 1. Icône flottante de traduction

**Fichier créé :** `components/ui/FloatingLangSwitcher.tsx`  
**Fichier modifié :** `app/layout.tsx`

L'ancien bouton FR/EN dans le header a été **supprimé** et remplacé par un composant flottant positionné en **bas à gauche** de l'écran, visible sur toutes les pages. Avantages :
- Libère de l'espace dans la navbar (surtout sur mobile)
- Toujours accessible quel que soit le scroll
- Tooltip explicatif au survol
- Design adapté au mode clair/sombre

### ✅ 2. Refactorisation du Header (Navbar.tsx)

**Problèmes corrigés :**
- **Doublon "Contribuer"** : le bouton Contribuer apparaissait 2 fois sur mobile (barre + menu burger). Corrigé → n'apparaît que dans la barre principale.
- **Doublon switch langue** : le switch FR/EN était dans la barre ET dans le menu mobile. Corrigé → uniquement via FloatingLangSwitcher.
- **Responsive** : la navbar est maintenant proprement responsive sur 3 breakpoints :
  - Mobile : Logo + Actions essentielles + Burger
  - Tablette : idem
  - Desktop : Logo + Liens centrés + Actions

### ✅ 3. Couleur de fond mode clair

**Fichier modifié :** `app/globals.css`

| | Avant | Après |
|--|-------|-------|
| `--faso-night` (fond principal) | `#F5F0E8` (beige chaud) | `#E8EDF2` (gris-bleu ardoise) |
| `--faso-dusk` (fond secondaire) | `#EDE7DA` (beige clair) | `#DDE3EA` (gris-bleu moyen) |

Le mode sombre reste **identique et non modifié**.  
La nouvelle couleur `#E8EDF2` est plus neutre, reposante pour les yeux, et s'harmonise mieux avec les boutons dorés, rouges et verts du drapeau.

---

## 🔧 Checklist de mise en production

- [ ] Cloner le repo : `git clone https://github.com/poodasamuelpro/BurkinaVista.git`
- [ ] Créer `.env.local` depuis `.env.local.example`
- [ ] Configurer Neon et appliquer `neon-migration.sql`
- [ ] Créer un compte Cloudinary et copier les clés
- [ ] Créer un compte Cloudflare Stream (si vidéos nécessaires)
- [ ] Obtenir une clé Gemini AI sur Google AI Studio
- [ ] Créer un compte Resend et vérifier le domaine email
- [ ] Définir `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`
- [ ] Déployer sur Vercel et configurer les variables d'environnement
- [ ] Tester l'upload d'une photo depuis `/upload`
- [ ] Vérifier la réception des emails admin
- [ ] Tester la modération depuis le panel `/admin`
- [ ] Vérifier le sitemap : `/sitemap.xml`

---

*Documentation générée pour le projet BurkinaVista — Bibliothèque Visuelle du Burkina Faso*  
*🇧🇫 Burkina · Vista — Tous droits réservés*
