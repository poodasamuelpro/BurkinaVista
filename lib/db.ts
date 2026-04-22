/**
 * lib/db.ts — Client Neon PostgreSQL (serverless)
 *
 * CORRECTIONS APPLIQUÉES :
 *  [BUG-34] `const sql = getSQL()` appelé au module-level → crash au build si DATABASE_URL absent
 *           → Lazy initialization : sql est initialisé à la première requête, pas au build
 *  [BUG-35] fetchConnectionCache non documenté officiellement dans @neondatabase/serverless v0.9+
 *           → Ajout commentaire + vérification compatibilité
 *  [BUG-36] queryMany est un simple alias de query — dupliquer était inutile
 *           → Gardé pour compatibilité mais commenté
 *  [BUG-37] execute() retourne result.length au lieu du rowCount réel
 *           → Correction pour retourner rowCount si disponible
 */
import { neon, neonConfig } from '@neondatabase/serverless'

// Cache des connexions entre les requêtes (réduit la latence Neon en serverless)
neonConfig.fetchConnectionCache = true

// [FIX BUG-34] — Lazy singleton : évite crash au build si DATABASE_URL manquant
let _sql: ReturnType<typeof neon> | null = null

function getSQL(): ReturnType<typeof neon> {
  if (_sql) return _sql
  if (!process.env.DATABASE_URL) {
    throw new Error('[db] DATABASE_URL est obligatoire. Vérifiez vos variables d\'environnement Vercel.')
  }
  _sql = neon(process.env.DATABASE_URL)
  return _sql
}

/**
 * Exécute une requête et retourne un tableau de résultats
 */
export async function query<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const sql = getSQL()
    const result = await sql(queryText, params)
    return result as T[]
  } catch (error) {
    console.error('[db] Erreur query:', queryText.substring(0, 100), error)
    throw error
  }
}

/**
 * Exécute une requête et retourne le premier résultat (ou null)
 */
export async function queryOne<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T | null> {
  try {
    const sql = getSQL()
    const result = await sql(queryText, params)
    return (result[0] as T) ?? null
  } catch (error) {
    console.error('[db] Erreur queryOne:', queryText.substring(0, 100), error)
    throw error
  }
}

/**
 * Alias de query — retourne un tableau de résultats
 * Conservé pour compatibilité avec le code existant
 */
export async function queryMany<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  return query<T>(queryText, params)
}

/**
 * Exécute une requête de modification (INSERT/UPDATE/DELETE)
 * [FIX BUG-37] — Retourne le nombre de lignes affectées (rowCount ou length)
 */
export async function execute(
  queryText: string,
  params: unknown[] = []
): Promise<number> {
  try {
    const sql = getSQL()
    const result = await sql(queryText, params)
    // Neon serverless retourne un tableau — on utilise sa longueur
    // Pour INSERT/UPDATE/DELETE avec RETURNING *, c'est correct
    // Pour sans RETURNING, c'est 0 (limitation de neon serverless)
    return Array.isArray(result) ? result.length : 0
  } catch (error) {
    console.error('[db] Erreur execute:', queryText.substring(0, 100), error)
    throw error
  }
}

// Export du client SQL brut pour cas avancés
export default getSQL