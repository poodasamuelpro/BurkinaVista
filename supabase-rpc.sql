-- ============================================
-- FASOSTOCK - Fonctions RPC supplémentaires
-- À exécuter après la migration principale
-- ============================================

-- Incrémenter les vues
CREATE OR REPLACE FUNCTION increment_views(media_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE medias SET views = views + 1 WHERE id = media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrémenter les téléchargements
CREATE OR REPLACE FUNCTION increment_downloads(media_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE medias SET downloads = downloads + 1 WHERE id = media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stats admin globales
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_medias', (SELECT COUNT(*) FROM medias),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'pending_count', (SELECT COUNT(*) FROM medias WHERE statut = 'pending'),
    'approved_count', (SELECT COUNT(*) FROM medias WHERE statut = 'approved'),
    'total_downloads', (SELECT COALESCE(SUM(downloads), 0) FROM medias),
    'total_views', (SELECT COALESCE(SUM(views), 0) FROM medias),
    'photos_count', (SELECT COUNT(*) FROM medias WHERE type = 'photo' AND statut = 'approved'),
    'videos_count', (SELECT COUNT(*) FROM medias WHERE type = 'video' AND statut = 'approved')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
