export type MediaType = 'photo' | 'video'
export type LicenceType = 'CC0' | 'CC BY' | 'CC BY-NC' | 'CC BY-SA'
export type StatutType = 'pending' | 'approved' | 'rejected'

export interface Contributeur {
  id: string
  nom: string
  prenom: string
  email: string
  tel?: string
  medias_count: number
  created_at: string
}

export interface Media {
  id: string
  type: MediaType
  // Champs photo
  cloudinary_url?: string
  cloudinary_public_id?: string
  width?: number
  height?: number
  // Champs vidéo
  stream_url?: string
  stream_id?: string
  thumbnail_url?: string
  duration?: number
  // SEO
  slug: string
  titre: string
  description: string
  alt_text: string
  tags: string[]
  categorie: string
  ville?: string
  region?: string
  // Contributeur (dénormalisé)
  contributeur_nom?: string
  contributeur_prenom?: string
  contributeur_email?: string
  contributeur_tel?: string
  // Méta
  licence: LicenceType
  downloads: number
  views: number
  statut: StatutType
  rejection_reason?: string
  created_at: string
  updated_at?: string
}

export interface Categorie {
  id: string
  nom: string
  slug: string
  description?: string
  cover_url?: string
  count?: number
}

export interface Abonne {
  id: string
  email: string
  nom?: string
  actif: boolean
  created_at: string
}

export interface NewsletterLog {
  id: string
  sujet: string
  nb_destinataires: number
  nb_medias: number
  statut: string
  envoye_le: string
}

export interface UploadFormData {
  titre?: string
  description?: string
  ville?: string
  region?: string
  categorie: string
  licence: LicenceType
  tags?: string[]
}

export interface SEOData {
  titre: string
  description: string
  alt_text: string
  tags: string[]
  slug: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface AdminStats {
  total_medias: number
  total_contributeurs: number
  total_abonnes: number
  total_downloads: number
  total_views: number
  pending_count: number
  photos_count: number
  videos_count: number
  medias_this_month: number
}
