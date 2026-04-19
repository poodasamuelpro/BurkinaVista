import { createServerSupabaseClient } from '@/lib/supabase'
import AdminCategoriesClient from './AdminCategoriesClient'

export default async function AdminCategoriesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: categories } = await supabase.from('categories').select('*').order('nom')
  return <AdminCategoriesClient categories={categories || []} />
}
