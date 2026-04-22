-- ============================================================
-- BurkinaVista — Script de CORRECTION des URLs vidéo existantes
-- ============================================================
-- À exécuter UNE SEULE FOIS après déploiement de la correction
-- de B2_PUBLIC_URL dans Vercel.
--
-- CONTEXTE :
-- Les vidéos uploadées AVANT la correction ont leur b2_url stockée
-- sous la forme :
--   https://burkinavistabf.poodasamuel.com/videos/xxx.mp4  ← 404 ❌
--
-- Ce script les met à jour vers le format correct :
--   https://burkinavistabf.poodasamuel.com/file/burkinavista-videos/videos/xxx.mp4  ← 200 ✅
--
-- ÉTAPES :
-- 1. Vérifier les URLs actuelles (SELECT ci-dessous)
-- 2. Appliquer le UPDATE
-- 3. Vérifier le résultat
-- ============================================================

-- ── ÉTAPE 1 : Diagnostic — Voir les URLs actuellement en 404 ──
SELECT id, slug, b2_url, b2_key, statut
FROM medias
WHERE type = 'video'
  AND b2_url IS NOT NULL
  AND b2_url NOT LIKE '%/file/%'  -- URLs avec l'ancien format (sans /file/)
ORDER BY created_at DESC;

-- ── ÉTAPE 2 : Mise à jour des URLs malformées ─────────────────
-- Remplace le préfixe CDN seul par CDN + /file/bucket
UPDATE medias
SET
  b2_url = REPLACE(
    b2_url,
    'https://burkinavistabf.poodasamuel.com/',
    'https://burkinavistabf.poodasamuel.com/file/burkinavista-videos/'
  ),
  updated_at = NOW()
WHERE
  type = 'video'
  AND b2_url IS NOT NULL
  AND b2_url LIKE 'https://burkinavistabf.poodasamuel.com/%'
  AND b2_url NOT LIKE '%/file/%';  -- Ne pas modifier les URLs déjà correctes

-- ── ÉTAPE 3 : Vérification post-correction ───────────────────
SELECT id, slug, b2_url, statut
FROM medias
WHERE type = 'video'
  AND b2_url IS NOT NULL
ORDER BY created_at DESC;

-- ── ÉTAPE 4 (optionnel) : Vérification qu'il ne reste plus d'URLs incorrectes
SELECT COUNT(*) AS urls_incorrectes
FROM medias
WHERE type = 'video'
  AND b2_url IS NOT NULL
  AND b2_url NOT LIKE '%/file/%';
-- Résultat attendu : 0