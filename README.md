# 🇧🇫 FasoStock — Bibliothèque Visuelle du Burkina Faso

Plateforme open de photos et vidéos libres de droits du Burkina Faso,
avec génération SEO automatique par IA.

---

## Stack Technique

- **Frontend** : Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **Stockage images** : Cloudinary
- **Stockage vidéos** : Cloudflare Stream
- **IA SEO** : Google Vision API + Claude (Anthropic)
- **Hébergement** : Vercel

---

## Installation

```bash
# 1. Cloner et installer
npm install

# 2. Copier les variables d'environnement
cp .env.local.example .env.local
# Remplir toutes les valeurs dans .env.local

# 3. Lancer en développement
npm run dev
```

---

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Exécuter dans cet ordre :
   - `supabase-migration.sql`
   - `supabase-rpc.sql`
4. Dans **Authentication > Providers**, activer Google OAuth si souhaité

---

## Variables d'environnement

Voir `.env.local.example` — toutes les clés à remplir :

| Variable | Service | Où trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Project Settings > API |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary | Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary | Dashboard > API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary | Dashboard > API Keys |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | Dashboard |
| `CLOUDFLARE_STREAM_API_TOKEN` | Cloudflare | API Tokens |
| `GOOGLE_VISION_API_KEY` | Google Cloud | APIs & Services |
| `ANTHROPIC_API_KEY` | Anthropic | console.anthropic.com |
| `NEXT_PUBLIC_APP_URL` | — | Ton domaine |

---

## Déploiement Vercel

```bash
# Via CLI
npx vercel

# Ou connecter le repo GitHub sur vercel.com
# Ajouter toutes les variables d'environnement dans Vercel Dashboard
```

---

## Rendre un utilisateur admin

Dans Supabase SQL Editor :
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'ton@email.com';
```

---

## Structure des pages

| URL | Description |
|---|---|
| `/` | Accueil — galerie masonry + hero |
| `/photos/[slug]` | Page détail média (SEO optimisé) |
| `/upload` | Formulaire upload + IA |
| `/categories` | Liste des catégories |
| `/categories/[slug]` | Photos par catégorie |
| `/profil/[id]` | Profil contributeur |
| `/auth/login` | Connexion |
| `/auth/register` | Inscription |
| `/admin` | Dashboard admin (réservé) |
| `/admin/photos` | Modération médias |
| `/admin/users` | Gestion utilisateurs |
| `/admin/categories` | Gestion catégories |
| `/sitemap.xml` | Sitemap dynamique auto |

---

## Fonctionnalités IA

À chaque upload :
1. **Google Vision** analyse l'image (labels, objets, couleurs, texte)
2. **Claude (Anthropic)** génère titre SEO, description, alt text, tags
3. L'IA améliore ce que l'utilisateur a écrit sans inventer
4. Slug URL unique généré automatiquement
5. Google pingé automatiquement après publication

---

## Couleurs du projet (drapeau BF)

```css
--faso-red:   #EF2B2D  /* Rouge */
--faso-green: #009A00  /* Vert */
--faso-gold:  #EFC031  /* Étoile dorée */
```

---

Fait avec ❤️ pour le Burkina Faso 🇧🇫
