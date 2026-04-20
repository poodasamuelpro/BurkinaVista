/**
 * lib/db.ts — Connexion Neon PostgreSQL
 * Utilise @neondatabase/serverless pour Vercel Edge/Node.js
 */
import { neon, neonConfig } from '@neondatabase/serverless'

// Configuration optimale pour les environnements serverless
neonConfig.fetchConnectionCache = true

// Instance SQL réutilisable (singleton)
const sql = neon(process.env.DATABASE_URL!)

/**
 * Exécute une requête SQL et retourne toutes les lignes
 */
export async function query<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const result = await sql(queryText, params)
    return result as T[]
  } catch (error) {
    console.error('Erreur DB query:', error)
    throw error
  }
}

/**
 * Exécute une requête SQL et retourne une seule ligne
 * Retourne null si aucun résultat
 */
export async function queryOne<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T | null> {
  try {
    const result = await sql(queryText, params)
    return (result[0] as T) || null
  } catch (error) {
    console.error('Erreur DB queryOne:', error)
    throw error
  }
}

/**
 * Exécute une requête SQL et retourne toutes les lignes (alias de query)
 */
export async function queryMany<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  return query<T>(queryText, params)
}

/**
 * Exécute une requête SQL sans retour de données (INSERT, UPDATE, DELETE)
 * Retourne le nombre de lignes affectées
 */
export async function execute(
  queryText: string,
  params: unknown[] = []
): Promise<number> {
  try {
    const result = await sql(queryText, params)
    // Neon retourne un tableau ; pour les mutations, on retourne la longueur
    return Array.isArray(result) ? result.length : 0
  } catch (error) {
    console.error('Erreur DB execute:', error)
    throw error
  }
}

export default sql
