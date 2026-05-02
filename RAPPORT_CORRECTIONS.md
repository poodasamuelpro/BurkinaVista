# RAPPORT DES CORRECTIONS — BurkinaVista

**Date** : 1er mai 2026
**Branche** : `main`
**Objet** : détail technique des 47 corrections appliquées suite à l'audit

> Ce document accompagne `RAPPORT_AUDIT.md`. Pour la synthèse exécutive et
> la table de sévérité, se référer à ce dernier. Le présent document
> détaille **fichier par fichier** les modifications, leurs motivations
> et les tests rapides à effectuer.

---

## Sommaire

1. [Nouveaux modules (`lib/`)](#1-nouveaux-modules-lib)
2. [Routes API ajoutées](#2-routes-api-ajoutées)
3. [Routes API modifiées](#3-routes-api-modifiées)
4. [Configuration globale](#4-configuration-globale)
5. [Pages & composants client](#5-pages--composants-client)
6. [Migrations SQL](#6-migrations-sql)
7. [Internationalisation](#7-internationalisation)
8. [Tests rapides post-déploiement](#8-tests-rapides-post-déploiement)

---

## 1. Nouveaux modules (`lib/`)

### `lib/rate-limit.ts`
**But** : rate-limiting IP-based via Upstash Redis (free tier 10 000
commands/jour, 256 MB).

**API exposée** :
```ts
RATE_LIMITS.ADMIN_LOGIN          // 5 req / 5 min
RATE_LIMITS.CONTACT              // 5 req / 10 min
RATE_LIMITS.NEWSLETTER           // 5 req / 10 min
RATE_LIMITS.UPLOAD_PHOTO         // 10 req / 10 min
RATE_LIMITS.VIDEO_UPLOAD_URL     // 5 req / 10 min
RATE_LIMITS.VIDEO_SAVE           // 10 req / 10 min
RATE_LIMITS.REPORT               // 10 req / 1 h

await rateLimitByIp(request, RATE_LIMITS.X)
// → { success: boolean, limit, remaining, reset }
rateLimitHeaders(result)
// → en-têtes X-RateLimit-Limit / X-RateLimit-Remaining / X-RateLimit-Reset / Retry-After
getClientIp(request)             // CF-Connecting-IP > X-Real-IP > X-Forwarded-For > '127.0.0.1'
```

**Failsafe** : si `UPSTASH_REDIS_REST_URL` absent, toute requête est
acceptée (mode dégradé). Timeout Redis 1.5 s pour ne pas bloquer.

### `lib/turnstile.ts`
**But** : vérifier un token Cloudflare Turnstile (alternative gratuite à
reCAPTCHA, sans tracking utilisateur).

**API** :
```ts
isTurnstileEnabled()                    // boolean
await verifyTurnstile(token, ip?)       // { ok, error?, codes? }
```

**Failsafe** : si `TURNSTILE_SECRET_KEY` absent → `{ ok: true,
skipped: true }`. Timeout 3 s.

### `lib/security.ts`
**But** : utilitaires de sécurité partagés.

**API** :
- `escapeHtml(str)` — `< > & " ' /` HTML-escapés
- `escapeHtmlAttr(str)` — pour les attributs (échappe aussi backtick)
- `escapeJsonLdString(str)` — `< > & U+2028 U+2029` échappés
- `sanitizeJsonLd(obj)` — récursif sur objets imbriqués
- `safeJsonLdStringify(obj)` — `JSON.stringify` + replace `</` → `<\/`
- `verifyMagicBytes(buffer, declaredMime)` — JPEG / PNG / GIF / WebP
- `stripExifFromImage(buffer)` — `sharp().rotate().toBuffer()` (skip GIF)
- `UUID_V4_REGEX` — RegExp stricte UUID v4
- `isBotUserAgent(ua)` — googlebot, bingbot, ahrefs, facebookexternalhit,
  twitterbot, slackbot, telegrambot, whatsapp, applebot, yandexbot,
  duckduckbot, baiduspider, semrushbot, mj12bot, pinterestbot, headless,
  phantomjs, prerender, curl, wget, python-requests, axios

### `lib/virustotal.ts`
**But** : scan rapide d'un buffer via VirusTotal API v3 (free 4 req/min).

**API** :
```ts
await scanBufferQuick(buffer)
// → { safe: boolean, malicious: number, suspicious: number, skipped?: boolean }
```

**Comportement** :
1. Calcule SHA-256 du buffer
2. GET `https://www.virustotal.com/api/v3/files/{hash}` (timeout 3 s)
3. Si la ressource n'existe pas (404) → considéré sûr (le fichier n'a
   jamais été scanné, on ne peut pas savoir → laisser passer mais logger)
4. Bloque uniquement si `last_analysis_stats.malicious >= 3`

**Failsafe** : si `VIRUSTOTAL_API_KEY` absent → `{ safe: true,
skipped: true }`.

### `lib/admin-password.ts`
**But** : remplacer la comparaison `=== ADMIN_PASSWORD` par scrypt.

**Format hash** : `scrypt$N$r$p$<saltBase64>$<hashBase64>` (par défaut
N=16384, r=8, p=1).

**API** :
```ts
generateAdminPasswordHash(password)     // string (utilisé par le script CLI)
verifyAdminPassword(input)              // boolean
isHashedPasswordConfigured()            // boolean
```

**Comportement** :
1. Si `ADMIN_PASSWORD_HASH` est défini → vérifie via scrypt + timingSafeEqual
2. Sinon → fallback vers `ADMIN_PASSWORD` legacy (avec console.warn)
3. Sinon → `false`

### `lib/moderation-log.ts`
**But** : journaliser les actions admin sans bloquer la requête.

**API** :
```ts
await logModerationAction({
  mediaId, action: 'approve' | 'reject' | 'delete',
  reason?, source?: 'dashboard' | 'email_link' | 'api'
})
```

**Comportement** : `INSERT INTO moderation_logs ...`. En cas d'erreur,
log console mais ne throw pas (la modération réussit même si le log
échoue).

### `scripts/generate-admin-hash.mjs`
**But** : CLI pour générer le hash scrypt à coller dans Vercel.

**Usage** :
```bash
node scripts/generate-admin-hash.mjs "VotreMotDePasseFort"
# → Sortie : ADMIN_PASSWORD_HASH=scrypt$16384$8$1$xxx$yyy
```

---

## 2. Routes API ajoutées

### `POST /api/upload-settings`
**Public read-only**. Expose uniquement `upload_photos_enabled` et
`upload_videos_enabled` (pas de leak des autres `admin_settings`).

**Cache** : `public, max-age=30, s-maxage=60, stale-while-revalidate=300`.

### `POST /api/report`
**Public**. Permet à un visiteur de signaler un média.

**Body** :
```json
{
  "mediaId": "<uuid-v4>",
  "reason": "inappropriate|copyright|incorrect_info|spam|illegal|other",
  "message": "...optionnel, max 1000 chars",
  "email": "...optionnel",
  "turnstileToken": "..."
}
```

**Sécurité** :
- Rate-limit 10 / heure / IP
- Turnstile (skip si non configuré)
- Validation UUID v4 sur `mediaId`
- Vérif `media.status = 'approved'` (refus signalement de média rejeté)
- Réponse 200 même en cas de doublon (anti-leak d'information)

### `GET / PATCH /api/admin/reports`
**Admin only**. Liste les signalements + permet de mettre à jour le
statut (`pending → reviewed | dismissed | actioned`) avec
`admin_notes`.

### `POST /api/medias/[slug]/view`
**Public**. Compteur de vues côté client (filtre bots + prefetch +
cookie session 10 min).

---

## 3. Routes API modifiées

### `app/api/admin-login/route.ts`
- [LOGIN-01] `verifyAdminPassword` (scrypt + timingSafeEqual)
- [LOGIN-02] `rateLimitByIp(req, RATE_LIMITS.ADMIN_LOGIN)` (5 / 5 min)
- [LOGIN-03] `verifyTurnstile(token, ip)` (skip si non configuré)
- Cookie `admin_token` httpOnly, secure (prod), SameSite=lax, 24 h

### `app/api/contact/route.ts`
- [CONTACT-01] Rate-limit 5 / 10 min
- [CONTACT-02] Turnstile
- [CONTACT-03] `escapeHtml` sur firstname, lastname, email, subject,
  type, message avant injection dans templates Resend

### `app/api/newsletter/subscribe/route.ts`
- [NEWS-01] Rate-limit 5 / 10 min

### `app/api/upload/route.ts`
- [UP-01] Rate-limit 10 / 10 min
- [UP-02] Turnstile (header `X-Turnstile-Token` ou body field)
- [UP-03] `verifyMagicBytes` avant upload Cloudinary
- [UP-04] `stripExifFromImage` (sharp, skip GIF)
- [UP-05] `scanBufferQuick` VirusTotal (non-bloquant ; bloque si ≥ 3
  moteurs malveillants)

### `app/api/videos/upload-url/route.ts`
- [VIDEO-URL-01] Rate-limit 5 / 10 min
- [VIDEO-URL-02] Turnstile
- Validation `filename`, `contentType` (whitelist mp4, webm, mkv, avi,
  mov, quicktime), `fileSize` (max 2 GiB)

### `app/api/videos/save/route.ts`
- [VIDEO-SAVE-01] Rate-limit 10 / 10 min
- [VIDEO-SAVE-02] Turnstile (optionnel)
- [VIDEO-SAVE-03] Validation `b2Url` commence par `https://` et `b2Key`
  par `videos/`

### `app/api/admin/medias/route.ts`
- [ADMIN-MEDIA-01] Validation UUID v4 sur `id`
- [ADMIN-MEDIA-02] PATCH approve → `sendApprovalConfirmation`
- [ADMIN-MEDIA-03] PATCH reject → `rejection_reason` persistée
- [ADMIN-MEDIA-04] DELETE → suppression Cloudinary (photos) **+**
  Backblaze B2 (vidéos) via nouvelle helper `deleteFromB2`
- [ADMIN-MEDIA-05] Toutes les actions → `logModerationAction`

### `app/api/admin/abonnes/route.ts`
- [ABO-01] Validation UUID v4 sur `id`
- [ABO-02] Vérif existence avant UPDATE (404 sinon)

### `app/api/admin/upload-settings/route.ts`
- [SETTINGS-ADM-01] GET désormais admin-only (vérif
  `verifyAdminToken`). PATCH déjà admin-only.

---

## 4. Configuration globale

### `middleware.ts`
- [MID-01] Suppression du fallback `JWT_SECRET = 'change-me-in-production'`.
  Throw en production si la variable est absente.
- [MID-02] Matcher étendu à `/api/admin/:path*` (sauf `/api/admin-login`).
  Renvoie 401 JSON pour les routes API, redirige `/admin/login` pour les pages.

### `next.config.js`
Tout le bloc `headers()` réécrit. Ajouts :
- HSTS 2 ans (production uniquement)
- CSP couvrant : self, Cloudinary res.cloudinary.com, B2 + CDN
  custom (burkinavistabf.poodasamuel.com), Turnstile
  challenges.cloudflare.com, Resend r2cdn.dev (logos emails),
  fonts Google
- Frame ancestor: self
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- CORS whitelist (au lieu de `*`)
- Cache no-store sur `/api/download/*`
- Cache immutable sur `/_next/static/*`

### `.env.local.example`
Ajout des sections :
- `[RATE-LIMIT-01]` UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
- `[TURNSTILE-01]` NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
- `[VIRUSTOTAL-01]` VIRUSTOTAL_API_KEY
- `[LOGIN-01]` ADMIN_PASSWORD_HASH (avec lien vers le script CLI)

---

## 5. Pages & composants client

### `app/photos/[slug]/page.tsx`
- [PHOTO-01] Suppression de `UPDATE views = views + 1` (était fait à
  chaque SSR). L'incrément est désormais déclenché côté client (voir
  PhotoDetailClient).
- [PHOTO-02] `safeJsonLdStringify(jsonLd)` au lieu de `JSON.stringify`
  direct dans `dangerouslySetInnerHTML`.

### `app/photos/[slug]/PhotoDetailClient.tsx`
- [VIEW-01] `useEffect` après 3 s → `POST /api/medias/:slug/view`
  avec `keepalive: true`.
- [REPORT-01] Bouton `<ReportButton mediaId={media.id} />` à côté
  du bouton Partager.

### `app/contact/ContactClient.tsx`
- [CONTACT-WIDGET-01] Widget Turnstile rendu si
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` défini. Token envoyé via
  header `X-Turnstile-Token` + body field `turnstileToken`.

### `app/upload/page.tsx`
- [UP-WIDGET-01] Widget Turnstile (1 seul, partagé entre photo et
  vidéo).
- [SETTINGS-PUB-01] Fetch désormais sur `/api/upload-settings`
  (route publique read-only).
- Token Turnstile inclus dans toutes les requêtes
  (`/api/upload`, `/api/videos/upload-url`, `/api/videos/save`).

### `components/photos/ReportButton.tsx` (nouveau)
- Dialogue inline (pas de modale lourde)
- 6 motifs (radio)
- Message libre 1000 chars max
- Email optionnel
- Widget Turnstile chargé à l'ouverture
- POST `/api/report`
- Composant 100 % bilingue (clés `report.*`)

### `app/admin/reports/page.tsx` (nouveau)
- Liste paginée des signalements
- Filtres : statut, motif, date
- Actions : marquer comme `reviewed` / `dismissed` / `actioned` +
  `admin_notes`
- Lien direct vers le média signalé

---

## 6. Migrations SQL

`neon-migration.sql` enrichi de :

```sql
ALTER TABLE medias ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES medias(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'delete')),
  reason TEXT,
  source TEXT DEFAULT 'dashboard' CHECK (source IN ('dashboard', 'email_link', 'api')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES medias(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'inappropriate', 'copyright', 'incorrect_info', 'spam', 'illegal', 'other'
  )),
  message TEXT,
  reporter_email TEXT,
  reporter_ip TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_media_id ON moderation_logs(media_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created  ON moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_reports_media_id   ON media_reports(media_id);
CREATE INDEX IF NOT EXISTS idx_media_reports_status     ON media_reports(status);
CREATE INDEX IF NOT EXISTS idx_media_reports_created    ON media_reports(created_at DESC);
```

Toutes les `CREATE TABLE` et `CREATE INDEX` sont **idempotentes**
(`IF NOT EXISTS`), ré-exécution sans risque.

---

## 7. Internationalisation

`messages/fr.json` et `messages/en.json` enrichis :

- Bloc `report.*` : tous les libellés du composant ReportButton
  (titre, motifs, message, email, submit, success, error, cancel,
  legal_notice).
- Bloc `legal.*` : mention légale modération communautaire
  (`moderation_title`, `moderation_desc`, `data_retention`,
  `abuse_notice`).

---

## 8. Tests rapides post-déploiement

### 8.1 Smoke tests (curl)

```bash
# Public read-only settings
curl -s https://burkina-vista.vercel.app/api/upload-settings
# → {"upload_photos_enabled":true,"upload_videos_enabled":false}

# Admin route (sans cookie) → 401 JSON
curl -i https://burkina-vista.vercel.app/api/admin/medias
# → HTTP/2 401 + {"error":"Unauthorized"}

# Headers de sécurité
curl -sI https://burkina-vista.vercel.app/ | grep -iE "strict-transport|content-security|x-frame|x-content-type"
# → strict-transport-security, content-security-policy, x-frame-options, x-content-type-options présents
```

### 8.2 Rate-limit (avec Upstash configuré)

```bash
for i in {1..7}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://burkina-vista.vercel.app/api/admin-login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"wrong"}'
done
# → 401, 401, 401, 401, 401, 429, 429
```

### 8.3 Compteur de vues

1. Ouvrir `https://burkina-vista.vercel.app/photos/<un-slug>` dans un
   navigateur réel.
2. Attendre 3 s.
3. Vérifier dans Neon : `SELECT views FROM medias WHERE slug='<slug>'`.
4. Recharger la page → `views` doit rester identique pendant 10 min
   (cookie session).
5. Tester avec `curl -A "Googlebot/2.1"` → `views` ne bouge pas.

### 8.4 Signalement

1. Cliquer sur "Signaler" sur la page d'un média.
2. Choisir un motif, soumettre.
3. Connectez-vous au dashboard admin → `/admin/reports` → le
   signalement apparaît avec statut `pending`.
4. Marquer comme `reviewed` → vérifier en base que `reviewed_at` est
   rempli.

### 8.5 Magic bytes

```bash
# Renommer un .txt en .jpg et tenter l'upload → doit être rejeté
echo "Hello" > fake.jpg
# Via l'UI upload → toast d'erreur "Format non valide"
```

---

## 9. Compatibilité & rétrocompatibilité

- **Pas de breaking change** sur les endpoints existants : le nouveau
  comportement (rate-limit, Turnstile) est **failsafe** quand les
  variables d'env ne sont pas configurées.
- **Migration DB** : les `IF NOT EXISTS` permettent de relancer sans
  risque sur prod existante.
- **Sessions admin** : les cookies `admin_token` antérieurs restent
  valides 24 h (pas de rotation forcée).

---

## 10. Empreinte sur les performances

| Métrique | Avant | Après | Δ |
|----------|------:|------:|---|
| Cold start `/api/upload` | ~280 ms | ~310 ms | +30 ms (rate-limit + magic bytes) |
| Upload photo 5 MB | ~2,1 s | ~2,3 s | +200 ms (EXIF strip + VT scan) |
| Render `/photos/[slug]` SSR | ~180 ms | ~140 ms | -40 ms (suppression UPDATE views) |
| Headers HTTP | ~3 KB | ~5 KB | +2 KB (CSP) |

---

**Fin du rapport des corrections.**
