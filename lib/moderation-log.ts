/**
 * lib/moderation-log.ts — Helper d'écriture dans la table moderation_logs
 *
 * AJOUT (Audit 2026-05-01) :
 *  La table moderation_logs existe dans neon-migration.sql mais n'était jamais
 *  alimentée. Ce module centralise l'écriture des logs pour chaque action
 *  PATCH (approve/reject) et DELETE effectuée par l'admin, avec la source
 *  d'où provient l'action (dashboard / email_link / api).
 *
 *  Schéma (rappel neon-migration.sql) :
 *    moderation_logs(id UUID, media_id UUID, action TEXT, reason TEXT,
 *                    source TEXT, created_at TIMESTAMPTZ)
 *
 *  L'écriture est non-bloquante : en cas d'erreur on log mais on n'échoue pas
 *  l'opération principale (approve/reject/delete reste prioritaire).
 */
import { query } from './db'

export type ModerationAction = 'approve' | 'reject' | 'delete'
export type ModerationSource = 'dashboard' | 'email_link' | 'api'

export interface ModerationLogEntry {
  mediaId: string | null
  action: ModerationAction
  source: ModerationSource
  reason?: string | null
  /** Email de l'admin (optionnel, pour traçabilité future) */
  adminEmail?: string | null
}

/**
 * Insère une ligne dans moderation_logs. Best-effort : ne jette jamais d'erreur.
 */
export async function logModerationAction(entry: ModerationLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO moderation_logs (media_id, action, reason, source)
       VALUES ($1, $2, $3, $4)`,
      [
        entry.mediaId,
        entry.action,
        entry.reason ?? null,
        entry.source,
      ]
    )
  } catch (err) {
    console.error('[moderation-log] Erreur écriture log:', err)
    // Pas de re-throw : la modération ne doit jamais échouer à cause du log
  }
}
