export type MediaType = 'photo' | 'video'
export type LicenceType = 'CC0' | 'CC BY' | 'CC BY-NC' | 'CC BY-SA'
export type StatutType = 'pending' | 'approved' | 'rejected'
export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  nom: string
  avatar_url?: string
  bio?: string
  role: UserRole
  photos_count: number
  created_at: string
}

export interface Media {
  id: string
  type: MediaType
  // Photo fields
  cloudinary_url?: string
  cloudinary_public_id?: string
  // Video fields
  stream_url?: string
  stream_id?: string
  thumbnail_url?: string
  duration?: number
  // Common SEO fields
  slug: string
  titre: string
  description: string
  alt_text: string
  tags: string[]
  categorie: string
  ville?: string
  region?: string
  // Meta
  auteur_id: string
  auteur?: User
  licence: LicenceType
  downloads: number
  views: number
  statut: StatutType
  width?: number
  height?: number
  created_at: string
}

export interface Categorie {
  id: string
  nom: string
  slug: string
  description?: string
  cover_url?: string
  count?: number
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
  total_users: number
  total_downloads: number
  total_views: number
  pending_count: number
  photos_count: number
  videos_count: number
  medias_this_month: number
}
