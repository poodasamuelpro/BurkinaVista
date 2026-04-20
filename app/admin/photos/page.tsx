/**
 * app/admin/photos/page.tsx — Gestion des médias (admin)
 * Filtrage par statut, pagination
 */
import { queryMany, queryOne } from '@/lib/db'
import AdminPhotosClient from './AdminPhotosClient'
import type { Media } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { statut?: string; page?: string }
}

export default async function AdminPhotosPage({ searchParams }: Props) {
  const statut = searchParams.statut || 'pending'
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const [medias, countResult] = await Promise.all([
    queryMany<Media>(
      `SELECT * FROM medias 
       WHERE statut = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [statut, limit, offset]
    ),
    queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM medias WHERE statut = $1',
      [statut]
    ),
  ])

  return (
    <AdminPhotosClient
      medias={medias}
      total={Number(countResult?.total || 0)}
      page={page}
      statut={statut}
    />
  )
}
