-- ============================================================
-- BurkinaVista — Migration complète Neon PostgreSQL
-- Dernière mise à jour : sync avec DB réelle
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
  duration INT,

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

  -- Contributeur (dénormalisé)
  contributeur_nom TEXT,
  contributeur_prenom TEXT,
  contributeur_email TEXT,
  contributeur_tel TEXT,

  -- Méta
  licence TEXT DEFAULT 'CC BY',
  downloads INT DEFAULT 0,
  views INT DEFAULT 0,
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
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
  email TEXT NOT NULL,
  tel TEXT,
  medias_count INT DEFAULT 0,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: newsletter_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet TEXT,
  nb_destinataires INT DEFAULT 0,
  nb_medias INT DEFAULT 0,
  statut TEXT DEFAULT 'sent',
  envoye_le TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: admin_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_medias_statut      ON medias(statut);
CREATE INDEX IF NOT EXISTS idx_medias_categorie   ON medias(categorie);
CREATE INDEX IF NOT EXISTS idx_medias_slug        ON medias(slug);
CREATE INDEX IF NOT EXISTS idx_medias_created_at  ON medias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medias_type        ON medias(type);

CREATE INDEX IF NOT EXISTS idx_medias_tags ON medias USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_medias_fulltext ON medias
  USING GIN(to_tsvector('french',
    coalesce(titre, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(ville, '')
  ));

CREATE INDEX IF NOT EXISTS idx_contributeurs_email ON contributeurs(email);
CREATE INDEX IF NOT EXISTS idx_abonnes_email       ON abonnes(email);
CREATE INDEX IF NOT EXISTS idx_abonnes_actif       ON abonnes(actif);

-- ============================================================
-- DONNÉES PAR DÉFAUT: categories
-- ============================================================
INSERT INTO categories (nom, slug, description) VALUES
  ('Architecture & Urbanisme',      'architecture-urbanisme',      'Bâtiments, monuments, villes et villages du Burkina Faso'),
  ('Marchés & Commerce',            'marches-commerce',            'Marchés traditionnels, commerce et vie économique'),
  ('Culture & Traditions',          'culture-traditions',          'Traditions, cérémonies, rites et coutumes burkinabè'),
  ('Nature & Paysages',             'nature-paysages',             'Paysages, faune, flore et sites naturels du Burkina Faso'),
  ('Gastronomie',                   'gastronomie',                 'Cuisine, plats traditionnels et gastronomie burkinabè'),
  ('Art & Artisanat',               'art-artisanat',               'Artisanat, art contemporain et patrimoine artistique'),
  ('Sport',                         'sport',                       'Sport, activités physiques et compétitions'),
  ('Portraits',                     'portraits',                   'Portraits du peuple burkinabè dans sa diversité'),
  ('Événements & Festivals',        'evenements-festivals',        'Fêtes, festivals, célébrations et événements culturels'),
  ('Infrastructure & Développement','infrastructure-developpement','Projets de développement, routes, ponts et infrastructures')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DONNÉES PAR DÉFAUT: admin_settings
-- ============================================================
INSERT INTO admin_settings (cle, valeur) VALUES
  ('newsletter_auto',          'true'),
  ('newsletter_jour',          'lundi'),
  ('upload_photos_enabled',    'true'),
  ('upload_videos_enabled',    'false')
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