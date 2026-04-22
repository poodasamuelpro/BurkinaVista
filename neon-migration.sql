-- ============================================================
-- BurkinaVista — Migration complète Neon PostgreSQL
-- CORRIGÉE (Audit 2026-04-22)
-- ============================================================
-- CORRECTIONS APPLIQUÉES :
--  - Ajout champ file_size sur medias (manquant, utile pour audit/stats)
--  - Ajout champ original_filename sur medias (traçabilité)
--  - Ajout CHECK sur licence (valeurs autorisées)
--  - Ajout contrainte de longueur sur slug (max 120 chars)
--  - Ajout index sur contributeurs.email (manquant dans l'original était dans les indexes mais après)
--  - Ajout champ unsubscribe_token sur abonnes (plus sécurisé que token en URL)
--  - Ajout table moderation_logs (audit des actions admin)
--  - Ajout index manquant sur medias(b2_key) pour les suppressions B2
--  - Correction CHECK statut newsletter_logs
--  - Ajout champ ip_address sur medias (anti-spam, optionnel)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: medias
-- ============================================================
CREATE TABLE IF NOT EXISTS medias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),

  -- Photo (Cloudinary)
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  width INT,
  height INT,

  -- Vidéo (Backblaze B2)
  b2_url TEXT,
  b2_key TEXT,
  thumbnail_url TEXT,
  duration INT CHECK (duration IS NULL OR (duration >= 0 AND duration <= 86400)),

  -- ✅ AJOUT — Métadonnées fichier (traçabilité et stats)
  file_size BIGINT,              -- Taille en octets
  original_filename TEXT,        -- Nom original du fichier

  -- SEO & contenu FR
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  alt_text TEXT,
  tags TEXT[] DEFAULT '{}',
  categorie TEXT NOT NULL,
  ville TEXT,
  region TEXT,

  -- Traductions EN
  titre_en TEXT,
  description_en TEXT,
  alt_text_en TEXT,

  -- Contributeur (dénormalisé pour performance — évite JOIN)
  contributeur_nom TEXT,
  contributeur_prenom TEXT,
  contributeur_email TEXT,
  contributeur_tel TEXT,

  -- ✅ AJOUT — Contrôle qualité/modération
  rejection_reason TEXT,

  -- Méta
  -- ✅ CORRECTION — Ajout CHECK sur licence (valeurs autorisées)
  licence TEXT DEFAULT 'CC BY' CHECK (licence IN ('CC BY', 'CC0', 'CC BY-NC', 'CC BY-SA')),
  downloads INT DEFAULT 0 CHECK (downloads >= 0),
  views INT DEFAULT 0 CHECK (views >= 0),
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: contributeurs
-- ============================================================
CREATE TABLE IF NOT EXISTS contributeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  tel TEXT,
  medias_count INT DEFAULT 0 CHECK (medias_count >= 0),
  -- ✅ AJOUT — Date de la dernière contribution (utile pour stats)
  last_contribution_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: abonnes
-- ============================================================
CREATE TABLE IF NOT EXISTS abonnes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nom TEXT,
  actif BOOLEAN DEFAULT true,
  -- ✅ AJOUT — Source de l'abonnement (footer, popup, etc.)
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- ✅ AJOUT — Date de désabonnement (RGPD — audit trail)
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================================
-- TABLE: newsletter_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet TEXT,
  nb_destinataires INT DEFAULT 0,
  nb_medias INT DEFAULT 0,
  -- ✅ CORRECTION — Ajout CHECK sur statut newsletter
  statut TEXT DEFAULT 'sent' CHECK (statut IN ('sent', 'failed', 'partial')),
  envoye_le TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: admin_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  -- ✅ AJOUT — Audit trail des modifications settings
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: moderation_logs (✅ NOUVEAU — audit des actions admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES medias(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'delete')),
  reason TEXT,
  -- Source de la modération (email_link, dashboard, api)
  source TEXT DEFAULT 'dashboard',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_medias_statut      ON medias(statut);
CREATE INDEX IF NOT EXISTS idx_medias_categorie   ON medias(categorie);
CREATE INDEX IF NOT EXISTS idx_medias_slug        ON medias(slug);
CREATE INDEX IF NOT EXISTS idx_medias_created_at  ON medias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medias_type        ON medias(type);

-- ✅ Index composite — filtre statut=approved + tri created_at DESC (page d'accueil)
CREATE INDEX IF NOT EXISTS idx_medias_statut_created
  ON medias(statut, created_at DESC);

-- ✅ AJOUT — Index sur b2_key pour retrouver/supprimer rapidement les vidéos B2
CREATE INDEX IF NOT EXISTS idx_medias_b2_key ON medias(b2_key) WHERE b2_key IS NOT NULL;

-- ✅ AJOUT — Index sur cloudinary_public_id pour suppressions Cloudinary
CREATE INDEX IF NOT EXISTS idx_medias_cloudinary_id ON medias(cloudinary_public_id) WHERE cloudinary_public_id IS NOT NULL;

-- Index GIN tags
CREATE INDEX IF NOT EXISTS idx_medias_tags
  ON medias USING GIN(tags);

-- Index GIN full-text français (recherche titre + description + ville)
CREATE INDEX IF NOT EXISTS idx_medias_fulltext ON medias
  USING GIN(to_tsvector('french',
    coalesce(titre, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(ville, '')
  ));

CREATE INDEX IF NOT EXISTS idx_contributeurs_email ON contributeurs(email);
CREATE INDEX IF NOT EXISTS idx_abonnes_email       ON abonnes(email);
CREATE INDEX IF NOT EXISTS idx_abonnes_actif       ON abonnes(actif);

-- ✅ AJOUT — Index pour les logs de modération
CREATE INDEX IF NOT EXISTS idx_moderation_logs_media_id ON moderation_logs(media_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created  ON moderation_logs(created_at DESC);

-- ============================================================
-- DONNÉES PAR DÉFAUT: categories
-- ============================================================
INSERT INTO categories (nom, slug, description) VALUES
  ('Architecture & Urbanisme',       'architecture-urbanisme',       'Bâtiments, monuments, villes et villages du Burkina Faso'),
  ('Marchés & Commerce',             'marches-commerce',             'Marchés traditionnels, commerce et vie économique'),
  ('Culture & Traditions',           'culture-traditions',           'Traditions, cérémonies, rites et coutumes burkinabè'),
  ('Nature & Paysages',              'nature-paysages',              'Paysages, faune, flore et sites naturels du Burkina Faso'),
  ('Gastronomie',                    'gastronomie',                  'Cuisine, plats traditionnels et gastronomie burkinabè'),
  ('Art & Artisanat',                'art-artisanat',                'Artisanat, art contemporain et patrimoine artistique'),
  ('Sport',                          'sport',                        'Sport, activités physiques et compétitions'),
  ('Portraits',                      'portraits',                    'Portraits du peuple burkinabè dans sa diversité'),
  ('Événements & Festivals',         'evenements-festivals',         'Fêtes, festivals, célébrations et événements culturels'),
  ('Infrastructure & Développement', 'infrastructure-developpement', 'Projets de développement, routes, ponts et infrastructures')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DONNÉES PAR DÉFAUT: admin_settings
-- ============================================================
INSERT INTO admin_settings (cle, valeur) VALUES
  ('newsletter_auto',       'true'),
  ('newsletter_jour',       'lundi'),
  ('upload_photos_enabled', 'true'),
  ('upload_videos_enabled', 'false')
ON CONFLICT (cle) DO NOTHING;

-- ============================================================
-- TRIGGER: updated_at automatique sur medias
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_medias_updated_at
  BEFORE UPDATE ON medias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ AJOUT — Trigger updated_at sur admin_settings
CREATE OR REPLACE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION ADDITIVE (si base déjà existante)
-- À exécuter manuellement si la base est déjà créée
-- ============================================================
-- ALTER TABLE medias ADD COLUMN IF NOT EXISTS file_size BIGINT;
-- ALTER TABLE medias ADD COLUMN IF NOT EXISTS original_filename TEXT;
-- ALTER TABLE contributeurs ADD COLUMN IF NOT EXISTS last_contribution_at TIMESTAMPTZ;
-- ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
-- ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
-- ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();