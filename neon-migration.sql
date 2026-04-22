-- ============================================================
-- BurkinaVista — Migration complète Neon PostgreSQL
-- VERSION FINALE VALIDÉE — Audit comparatif 2026-04-22
-- ============================================================
-- SOURCE : Fusion AUDIT original + corrections générées
-- VAINQUEUR par fichier :
--   - Generated corrections (burkinavista-corrections/) :
--     + Plus de contraintes CHECK (slug, titre, description, categorie, ville, région)
--     + CHECK source IN ('dashboard','email_link','api') sur moderation_logs
--     + Index composite type+statut (idx_medias_type_statut)
--     + ip_address INET (type correct vs TEXT de l'AUDIT)
--     + CORS B2 rappel complet avec etag exposé
--   - AUDIT original (BurkinaVista_AUDIT/) :
--     → Structure identique avec moins de CHECK → remplacé par generated
-- ============================================================
-- CORRECTIONS APPLIQUÉES :
--   [SQL-01] ip_address INET sur medias (anti-spam, RGPD-friendly)
--   [SQL-02] CHECK sur licence ('CC BY','CC0','CC BY-NC','CC BY-SA')
--   [SQL-03] CHECK longueur slug <= 120 chars
--   [SQL-04] Index composite statut+created_at (performance page d'accueil)
--   [SQL-05] Index b2_key pour suppressions B2 rapides
--   [SQL-06] Index cloudinary_public_id pour suppressions Cloudinary
--   [SQL-07] Trigger updated_at sur admin_settings (manquant original)
--   [SQL-08] Table moderation_logs — audit des actions admin
--   [SQL-09] abonnes : unsubscribed_at (RGPD) + source
--   [SQL-10] CHECK durée vidéo 0-86400s
--   [SQL-11] CHECK statut newsletter_logs ('sent','failed','partial')
--   [SQL-12] CHECK longueur titre <= 200, description <= 2000, ville/région <= 100
--   [SQL-13] CHECK catégorie parmi valeurs autorisées
--   [SQL-14] CHECK source moderation_logs IN ('dashboard','email_link','api')
--   [SQL-15] Index composite type+statut WHERE statut='approved'
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
  -- [SQL-10] Durée max 24h (86400s)
  duration INT CHECK (duration IS NULL OR (duration >= 0 AND duration <= 86400)),

  -- Métadonnées fichier
  file_size BIGINT,
  original_filename TEXT,
  -- [SQL-01] IP contributeur (anti-spam, nullable = RGPD-friendly)
  ip_address INET,

  -- SEO & contenu FR
  -- [SQL-03][SQL-12] Contraintes longueur
  slug TEXT UNIQUE NOT NULL CHECK (length(slug) <= 120),
  titre TEXT NOT NULL CHECK (length(titre) <= 200),
  description TEXT CHECK (description IS NULL OR length(description) <= 2000),
  alt_text TEXT,
  tags TEXT[] DEFAULT '{}',
  -- [SQL-13] catégorie parmi valeurs autorisées
  categorie TEXT NOT NULL CHECK (categorie IN (
    'Architecture & Urbanisme',
    'Marchés & Commerce',
    'Culture & Traditions',
    'Nature & Paysages',
    'Gastronomie',
    'Art & Artisanat',
    'Sport',
    'Portraits',
    'Événements & Festivals',
    'Infrastructure & Développement'
  )),
  -- [SQL-12] Longueur ville et région
  ville TEXT CHECK (ville IS NULL OR length(ville) <= 100),
  region TEXT CHECK (region IS NULL OR length(region) <= 100),

  -- Traductions EN
  titre_en TEXT,
  description_en TEXT,
  alt_text_en TEXT,

  -- Contributeur (dénormalisé pour performance — évite JOIN)
  contributeur_nom TEXT,
  contributeur_prenom TEXT,
  contributeur_email TEXT,
  contributeur_tel TEXT,

  -- Modération
  rejection_reason TEXT,

  -- Méta
  -- [SQL-02] CHECK sur licence
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
  -- [SQL-09] Source d'abonnement
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- [SQL-09] Date désabonnement (RGPD)
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
  -- [SQL-11] Valeurs : sent, failed, partial
  statut TEXT DEFAULT 'sent' CHECK (statut IN ('sent', 'failed', 'partial')),
  envoye_le TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: admin_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  -- [SQL-07] Audit trail
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: moderation_logs — [SQL-08] NOUVEAU
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID REFERENCES medias(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'delete')),
  reason TEXT,
  -- [SQL-14] Source stricte
  source TEXT DEFAULT 'dashboard' CHECK (source IN ('dashboard', 'email_link', 'api')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Index simples
CREATE INDEX IF NOT EXISTS idx_medias_statut      ON medias(statut);
CREATE INDEX IF NOT EXISTS idx_medias_categorie   ON medias(categorie);
CREATE INDEX IF NOT EXISTS idx_medias_slug        ON medias(slug);
CREATE INDEX IF NOT EXISTS idx_medias_created_at  ON medias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medias_type        ON medias(type);

-- [SQL-04] Index composite page d'accueil (statut=approved + tri date)
CREATE INDEX IF NOT EXISTS idx_medias_statut_created
  ON medias(statut, created_at DESC);

-- [SQL-15] Index composite type+statut (filtre par type dans grille)
CREATE INDEX IF NOT EXISTS idx_medias_type_statut
  ON medias(type, statut) WHERE statut = 'approved';

-- [SQL-05] Index b2_key pour suppressions B2
CREATE INDEX IF NOT EXISTS idx_medias_b2_key
  ON medias(b2_key) WHERE b2_key IS NOT NULL;

-- [SQL-06] Index cloudinary_public_id pour suppressions Cloudinary
CREATE INDEX IF NOT EXISTS idx_medias_cloudinary_id
  ON medias(cloudinary_public_id) WHERE cloudinary_public_id IS NOT NULL;

-- Index GIN tags
CREATE INDEX IF NOT EXISTS idx_medias_tags
  ON medias USING GIN(tags);

-- Index GIN full-text français (titre + description + ville)
CREATE INDEX IF NOT EXISTS idx_medias_fulltext ON medias
  USING GIN(to_tsvector('french',
    coalesce(titre, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(ville, '')
  ));

-- Indexes tables secondaires
CREATE INDEX IF NOT EXISTS idx_contributeurs_email ON contributeurs(email);
CREATE INDEX IF NOT EXISTS idx_abonnes_email       ON abonnes(email);
CREATE INDEX IF NOT EXISTS idx_abonnes_actif       ON abonnes(actif);

-- [SQL-08] Indexes moderation_logs
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

-- [SQL-07] Trigger updated_at sur admin_settings
CREATE OR REPLACE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION ADDITIVE — Si la base EXISTE DÉJÀ
-- Exécuter ces ALTER TABLE si les tables ont déjà été créées sans ces colonnes
-- ============================================================
-- ALTER TABLE medias ADD COLUMN IF NOT EXISTS file_size BIGINT;
-- ALTER TABLE medias ADD COLUMN IF NOT EXISTS original_filename TEXT;
-- ALTER TABLE medias ADD COLUMN IF NOT EXISTS ip_address INET;
-- ALTER TABLE medias ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
-- ALTER TABLE contributeurs ADD COLUMN IF NOT EXISTS last_contribution_at TIMESTAMPTZ;
-- ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
-- ALTER TABLE abonnes ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
-- ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajout contrainte CHECK sur licence si table existante :
-- ALTER TABLE medias ADD CONSTRAINT medias_licence_check
--   CHECK (licence IN ('CC BY', 'CC0', 'CC BY-NC', 'CC BY-SA'));
-- Ajout contrainte CHECK sur statut si table existante :
-- ALTER TABLE medias ADD CONSTRAINT medias_statut_check
--   CHECK (statut IN ('pending', 'approved', 'rejected'));

-- ============================================================
-- RAPPEL CORS B2 — À CONFIGURER DANS BACKBLAZE CONSOLE
-- ============================================================
-- Backblaze Console → Bucket → CORS Rules → Ajouter :
-- [
--   {
--     "corsRuleName": "BurkinaVistaPlayer",
--     "allowedOrigins": [
--       "https://burkina-vista.vercel.app",
--       "https://burkinavistabf.poodasamuel.com",
--       "http://localhost:3000"
--     ],
--     "allowedOperations": ["b2_download_file_by_name", "s3_get"],
--     "allowedHeaders": ["range", "content-type", "authorization"],
--     "exposeHeaders": ["content-length", "content-range", "accept-ranges", "etag"],
--     "maxAgeSeconds": 86400
--   }
-- ]
--
-- IMPORTANT : Si le bucket est déjà configuré via CLI b2 avec ces règles, NE PAS
-- reconfigurer manuellement — cela écraserait la config existante.
-- Vérifier via : b2 get-bucket <nom-bucket> | grep cors
-- ============================================================