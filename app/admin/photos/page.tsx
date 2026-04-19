import { createServerSupabaseClient } from '@/lib/supabase'
import AdminPhotosClient from './AdminPhotosClient'

interface Props {
  searchParams: { statut?: string; page?: string }
}

export default async function AdminPhotosPage({ searchParams }: Props) {
  const supabase = await createServerSupabaseClient()
  const statut = searchParams.statut || 'pending'
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const { data: medias, count } = await supabase
    .from('medias')
    .select('*, auteur:profiles(id, nom, email)', { count: 'exact' })
    .eq('statut', statut)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (
    <AdminPhotosClient
      medias={medias || []}
      total={count || 0}
      page={page}
      statut={statut}
    />
  )
}
