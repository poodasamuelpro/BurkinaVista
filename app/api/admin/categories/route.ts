/**
 * app/api/admin/categories/route.ts — API admin pour les catégories
 * POST : créer une catégorie
 * PATCH : modifier une catégorie
 * DELETE : supprimer une catégorie
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import slugify from 'slugify'

export const dynamic = 'force-dynamic'

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

// POST — Créer une catégorie
export async function POST(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { nom, description } = await req.json()

    if (!nom?.trim()) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const slug = slugify(nom, {
      lower: true,
      strict: true,
      locale: 'fr',
    })

    const [cat] = await query(
      'INSERT INTO categories (nom, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [nom.trim(), slug, description?.trim() || null]
    )

    return NextResponse.json({ success: true, categorie: cat })
  } catch (error) {
    console.error('Erreur POST catégorie:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — Modifier une catégorie
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id, nom, description } = await req.json()

    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const [cat] = await query(
      'UPDATE categories SET nom = $1, description = $2 WHERE id = $3 RETURNING *',
      [nom?.trim(), description?.trim() || null, id]
    )

    return NextResponse.json({ success: true, categorie: cat })
  } catch (error) {
    console.error('Erreur PATCH catégorie:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — Supprimer une catégorie
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    await query('DELETE FROM categories WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE catégorie:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
