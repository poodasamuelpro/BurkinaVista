-- ============================================
-- FASOSTOCK - Migration Supabase complète
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles (liée à auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  photos_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (nom, slug, description) VALUES
  ('Architecture & Urbanisme', 'architecture-urbanisme', 'Bâtiments, monuments et paysages urbains du Burkina Faso'),
  ('Marchés & Commerce', 'marches-commerce', 'La vie commerciale et les marchés traditionnels'),
  ('Culture & Traditions', 'culture-traditions', 'Fêtes, cérémonies et traditions culturelles burkinabè'),
  ('Nature & Paysages', 'nature-paysages', 'La beauté naturelle du Burkina Faso'),
  ('Gastronomie', 'gastronomie', 'La cuisine et les spécialités culinaires burkinabè'),
  ('Art & Artisanat', 'art-artisanat', 'L''artisanat traditionnel et l''art contemporain'),
  ('Sport', 'sport', 'Les activités sportives et compétitions'),
  ('Portraits', 'portraits', 'Les visages et les gens du Burkina Faso'),
  ('Événements & Festivals', 'evenements-festivals', 'Les grands événements culturels comme le FESPACO et le SIAO'),
  ('Infrastructure & Développement', 'infrastructure-developpement', 'Les projets de développement et infrastructures modernes')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TABLE: medias (photos + vidéos)
-- ============================================
CREATE TABLE IF NOT EXISTS medias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'photo' CHECK (type IN ('photo', 'video')),

  -- Champs photo (Cloudinary)
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  width INT,
  height INT,

  -- Champs vidéo (Cloudflare Stream)
  stream_url TEXT,
  stream_id TEXT,
  thumbnail_url TEXT,
  duration INT,

  -- SEO (généré par IA)
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  alt_text TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Catégorisation
  categorie TEXT NOT NULL,
  ville TEXT,
  region TEXT,

  -- Auteur
  auteur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Licence
  licence TEXT NOT NULL DEFAULT 'CC BY' CHECK (licence IN ('CC0', 'CC BY', 'CC BY-NC', 'CC BY-SA')),

  -- Stats
  downloads INT DEFAULT 0,
  views INT DEFAULT 0,

  -- Statut modération
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: downloads (tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID REFERENCES medias(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_medias_statut ON medias(statut);
CREATE INDEX IF NOT EXISTS idx_medias_categorie ON medias(categorie);
CREATE INDEX IF NOT EXISTS idx_medias_auteur ON medias(auteur_id);
CREATE INDEX IF NOT EXISTS idx_medias_created ON medias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medias_slug ON medias(slug);
CREATE INDEX IF NOT EXISTS idx_medias_tags ON medias USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_medias_search ON medias USING GIN(
  to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' || coalesce(ville, ''))
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto update photos_count sur profile
CREATE OR REPLACE FUNCTION update_user_photos_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.statut = 'approved' THEN
    UPDATE profiles SET photos_count = photos_count + 1 WHERE id = NEW.auteur_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.statut != 'approved' AND NEW.statut = 'approved' THEN
      UPDATE profiles SET photos_count = photos_count + 1 WHERE id = NEW.auteur_id;
    ELSIF OLD.statut = 'approved' AND NEW.statut != 'approved' THEN
      UPDATE profiles SET photos_count = photos_count - 1 WHERE id = NEW.auteur_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.statut = 'approved' THEN
    UPDATE profiles SET photos_count = photos_count - 1 WHERE id = OLD.auteur_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_photos_count
AFTER INSERT OR UPDATE OR DELETE ON medias
FOR EACH ROW EXECUTE FUNCTION update_user_photos_count();

-- Auto-create profile après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nom, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction recherche full-text
CREATE OR REPLACE FUNCTION search_medias(query TEXT)
RETURNS SETOF medias AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM medias
  WHERE statut = 'approved'
    AND to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' || coalesce(ville, ''))
    @@ plainto_tsquery('french', query)
  ORDER BY
    ts_rank(
      to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' || coalesce(ville, '')),
      plainto_tsquery('french', query)
    ) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- Profiles: lecture publique, écriture par soi-même
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Medias: lecture des approuvés publique
CREATE POLICY "medias_approved_public" ON medias FOR SELECT USING (statut = 'approved');
CREATE POLICY "medias_own_read" ON medias FOR SELECT USING (auth.uid() = auteur_id);
CREATE POLICY "medias_insert_auth" ON medias FOR INSERT WITH CHECK (auth.uid() = auteur_id);
CREATE POLICY "medias_own_update" ON medias FOR UPDATE USING (auth.uid() = auteur_id);

-- Admin: accès complet
CREATE POLICY "medias_admin_all" ON medias FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Downloads: tout le monde peut insérer, lecture admin seulement
CREATE POLICY "downloads_insert_all" ON downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "downloads_admin_read" ON downloads FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
