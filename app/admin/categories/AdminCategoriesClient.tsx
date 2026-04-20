'use client'
/**
 * app/admin/categories/AdminCategoriesClient.tsx — CRUD catégories
 * Sans Supabase — appels vers /api/admin/categories
 */
import { useState } from 'react'
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Categorie } from '@/types'

interface Props {
  categories: Categorie[]
}

export default function AdminCategoriesClient({ categories: init }: Props) {
  const [categories, setCategories] = useState<Categorie[]>(init)
  const [editing, setEditing] = useState<string | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [newNom, setNewNom] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const startEdit = (cat: Categorie) => {
    setEditing(cat.id)
    setEditNom(cat.nom)
    setEditDesc(cat.description || '')
  }

  const saveEdit = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nom: editNom, description: editDesc }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setCategories((prev) =>
        prev.map((c) => c.id === id ? { ...c, nom: editNom, description: editDesc } : c)
      )
      toast.success('Catégorie mise à jour')
      setEditing(null)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
    setLoading(false)
  }

  const deleteCategorie = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les médias associés conserveront leur catégorie.')) return
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('Catégorie supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const addCategory = async () => {
    if (!newNom.trim()) {
      toast.error('Nom requis')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newNom, description: newDesc }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCategories((prev) => [...prev, data.categorie])
      setNewNom('')
      setNewDesc('')
      setAdding(false)
      toast.success('Catégorie ajoutée !')
    } catch {
      toast.error('Erreur lors de l\'ajout')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-white">
          Catégories <span className="text-white/30 text-lg">({categories.length})</span>
        </h1>
        <button onClick={() => setAdding(true)} className="btn-gold text-sm py-2 px-4">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Formulaire ajout */}
      {adding && (
        <div className="card p-6 border border-faso-gold/20 animate-slide-down">
          <h3 className="font-medium text-white mb-4">Nouvelle catégorie</h3>
          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
              placeholder="Nom de la catégorie"
              className="input-field"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optionnel)"
              className="input-field"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={addCategory}
              disabled={loading}
              className="btn-primary py-2 px-4 text-sm"
            >
              <Save size={15} /> Sauvegarder
            </button>
            <button
              onClick={() => { setAdding(false); setNewNom(''); setNewDesc('') }}
              className="btn-ghost py-2 px-4 text-sm"
            >
              <X size={15} /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste catégories */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="card p-5">
            {editing === cat.id ? (
              <div className="space-y-3">
                <input
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                  className="input-field"
                />
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description"
                  className="input-field"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(cat.id)}
                    disabled={loading}
                    className="btn-primary py-1.5 px-3 text-sm"
                  >
                    <Save size={13} /> Sauver
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="btn-ghost py-1.5 px-3 text-sm"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{cat.nom}</p>
                  {cat.description && (
                    <p className="text-xs text-white/30 mt-0.5">{cat.description}</p>
                  )}
                  <p className="text-xs text-white/20 mt-1 font-mono">/{cat.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-faso-gold hover:bg-faso-gold/10 transition-all"
                    title="Modifier"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => deleteCategorie(cat.id)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-faso-red hover:bg-faso-red/10 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
