import { createServerSupabaseClient } from '@/lib/supabase'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminUsersClient users={users || []} />
}
