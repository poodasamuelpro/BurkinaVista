/**
 * app/admin/categories/page.tsx — Page admin des catégories
 */
import { queryMany } from '@/lib/db'
import AdminCategoriesClient from './AdminCategoriesClient'
import type { Categorie } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const categories = await queryMany<Categorie>(
    'SELECT * FROM categories ORDER BY nom ASC'
  )

  return <AdminCategoriesClient categories={categories} />
}
