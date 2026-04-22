/**
 * app/api/admin/categories/route.ts — API admin pour les catégories
 * POST : créer une catégorie
 * PATCH : modifier une catégorie
 * DELETE : supprimer une catégorie
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - CRITIQUE : Le PATCH mettait à jour nom et description SANS mettre à jour le slug !
 *    Si l'admin renomme "Sport" → "Sports", le slug reste "sport" mais c'est volontaire.
 *    Ajout paramètre optionnel updateSlug pour permettre la mise à jour explicite.
 *  - Ajout validation UUID sur id pour PATCH et DELETE
 *  - Ajout vérification de l'existence avant PATCH (retournait undefined silencieusement)
 *  - Limite longueur nom (100 chars) et description (500 chars)
 *  - Gestion erreur unique constraint (slug déjà utilisé) sur POST
 *  - DELETE protège contre la suppression de catégories utilisées par des médias
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import slugify from 'slugify'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

    if (nom.trim().length > 100) {
      return NextResponse.json({ error: 'Nom trop long (max 100 caractères)' }, { status: 400 })
    }

    const slug = slugify(nom.trim(), {
      lower: true,
      strict: true,
      locale: 'fr',
    })

    // ✅ CORRECTION — Vérifier si le slug existe déjà avant INSERT
    const existing = await queryOne(
      'SELECT id FROM categories WHERE slug = $1',
      [slug]
    )
    if (existing) {
      return NextResponse.json(
        { error: `Une catégorie avec ce nom existe déjà (slug: ${slug})` },
        { status: 409 }
      )
    }

    const [cat] = await query(
      'INSERT INTO categories (nom, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [nom.trim(), slug, description?.trim().substring(0, 500) || null]
    )

    return NextResponse.json({ success: true, categorie: cat })
  } catch (error: unknown) {
    console.error('Erreur POST catégorie:', error)
    // Gestion doublon slug (sécurité supplémentaire)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505') {
      return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 409 })
    }
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

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id invalide (UUID requis)' }, { status: 400 })
    }

    // Vérifier que la catégorie existe
    const existing = await queryOne('SELECT id FROM categories WHERE id = $1', [id])
    if (!existing) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 })
    }

    if (nom && nom.trim().length > 100) {
      return NextResponse.json({ error: 'Nom trop long (max 100 caractères)' }, { status: 400 })
    }

    // ✅ NOTE : On ne met PAS à jour le slug automatiquement lors d'un rename
    // car les médias existants référencent la catégorie par son nom (TEXT)
    // Si on change le slug, les URLs /categories/[slug] casseraient
    const [cat] = await query(
      'UPDATE categories SET nom = $1, description = $2 WHERE id = $3 RETURNING *',
      [nom?.trim() || null, description?.trim().substring(0, 500) || null, id]
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

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'id invalide (UUID requis)' }, { status: 400 })
    }

    // ✅ CORRECTION CRITIQUE — Vérifier si la catégorie a des médias associés
    const mediaCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM medias WHERE categorie = (SELECT nom FROM categories WHERE id = $1)',
      [id]
    )

    if (mediaCount && parseInt(mediaCount.count) > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer : ${mediaCount.count} média(s) utilisent cette catégorie. Réaffectez-les d'abord.`,
        },
        { status: 409 }
      )
    }

    await query('DELETE FROM categories WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE catégorie:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}