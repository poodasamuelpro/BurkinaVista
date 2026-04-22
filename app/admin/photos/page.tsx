/**
 * app/admin/photos/page.tsx — Gestion des médias (admin)
 * Filtrage par statut, pagination
 *
 * MODIFICATION (2026-04-22) :
 *  - Sans statut dans l'URL → affiche TOUS les médias (tous statuts confondus)
 *  - Avec ?statut=approved/pending/rejected → filtre par statut
 */
import { queryMany, queryOne } from '@/lib/db'
import AdminPhotosClient from './AdminPhotosClient'
import type { Media } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { statut?: string; page?: string }
}

export default async function AdminPhotosPage({ searchParams }: Props) {
  // statut peut être undefined (= tous) ou 'approved'/'pending'/'rejected'
  const statut = searchParams.statut || ''
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const [medias, countResult] = await Promise.all([
    statut
      ? queryMany<Media>(
          `SELECT * FROM medias
           WHERE statut = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [statut, limit, offset]
        )
      : queryMany<Media>(
          `SELECT * FROM medias
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        ),
    statut
      ? queryOne<{ total: number }>(
          'SELECT COUNT(*) as total FROM medias WHERE statut = $1',
          [statut]
        )
      : queryOne<{ total: number }>(
          'SELECT COUNT(*) as total FROM medias'
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
