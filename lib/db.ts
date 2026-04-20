import { neon, neonConfig } from '@neondatabase/serverless'

neonConfig.fetchConnectionCache = true

// Lazy init — pas de crash au build si DATABASE_URL manquante
const getSQL = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('[db] DATABASE_URL is not defined.')
  }
  return neon(process.env.DATABASE_URL)
}

const sql = getSQL()

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

export async function queryMany<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  return query<T>(queryText, params)
}

export async function execute(
  queryText: string,
  params: unknown[] = []
): Promise<number> {
  try {
    const result = await sql(queryText, params)
    return Array.isArray(result) ? result.length : 0
  } catch (error) {
    console.error('Erreur DB execute:', error)
    throw error
  }
}

export default sql