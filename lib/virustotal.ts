/**
 * lib/virustotal.ts — Scan antivirus via VirusTotal Public API
 *
 * AJOUT (Audit 2026-05-01) :
 *  Vérification antivirale optionnelle des fichiers uploadés. La fonction
 *  scanBufferQuick() ne BLOQUE JAMAIS l'upload : elle effectue un check
 *  best-effort avec un timeout court et un comportement de fallback :
 *
 *   - Si VIRUSTOTAL_API_KEY n'est pas définie       → skip silencieux (OK)
 *   - Si timeout dépassé (3s par défaut)            → skip silencieux (OK)
 *   - Si VirusTotal renvoie une erreur réseau       → skip silencieux (OK)
 *   - Si VirusTotal détecte un malware                → renvoie { safe: false }
 *   - Sinon                                            → renvoie { safe: true }
 *
 *  Stratégie : on calcule le SHA-256 du fichier et on interroge VirusTotal
 *  pour vérifier si ce hash est connu comme malicieux. Cela évite l'upload
 *  effectif vers VirusTotal (4 req/min limit) et garde le scan rapide.
 *
 *  Variable d'environnement :
 *   VIRUSTOTAL_API_KEY   — clé API publique gratuite (4 req/min)
 *
 *  Note : ce scan est PROACTIF (avant Cloudinary/B2) mais NON BLOQUANT.
 *  En cas de doute, il vaut mieux laisser passer (UX > sécurité absolue
 *  pour un projet open-source de photos publiques).
 */
import crypto from 'crypto'

export interface VirusScanResult {
  /** true si le fichier est sûr (ou si le scan a été skippé) */
  safe: boolean
  /** Optionnel : nombre de moteurs ayant détecté quelque chose */
  malicious?: number
  /** Optionnel : moteurs ayant signalé le fichier */
  detections?: string[]
  /** true si le scan a été effectivement réalisé */
  scanned: boolean
  /** Cause d'un éventuel skip : 'no-config' | 'timeout' | 'error' | undefined */
  skipReason?: 'no-config' | 'timeout' | 'error' | 'not-found'
}

const SCAN_TIMEOUT_MS = 3000

/**
 * Indique si VirusTotal est configuré.
 */
export function isVirusTotalEnabled(): boolean {
  return Boolean(process.env.VIRUSTOTAL_API_KEY)
}

/**
 * Calcule le hash SHA-256 d'un buffer (utilisé comme identifiant VirusTotal).
 */
function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Scan rapide best-effort via lookup du hash SHA-256 sur VirusTotal.
 *
 * Cette fonction NE BLOQUE JAMAIS l'upload : en cas d'erreur ou de timeout
 * elle retourne { safe: true, scanned: false, skipReason: ... }.
 *
 * @param buffer Buffer du fichier à scanner
 * @returns Résultat du scan (toujours résolu, jamais rejeté)
 */
export async function scanBufferQuick(buffer: Buffer): Promise<VirusScanResult> {
  if (!isVirusTotalEnabled()) {
    return { safe: true, scanned: false, skipReason: 'no-config' }
  }

  const hash = sha256(buffer)
  const apiKey = process.env.VIRUSTOTAL_API_KEY!

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS)

  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    })

    // 404 = hash inconnu → on n'a pas d'info négative, donc on autorise
    if (res.status === 404) {
      return { safe: true, scanned: true, skipReason: 'not-found' }
    }

    if (!res.ok) {
      console.warn('[virustotal] HTTP', res.status, '— scan skippé (failsafe)')
      return { safe: true, scanned: false, skipReason: 'error' }
    }

    const data = (await res.json()) as {
      data?: {
        attributes?: {
          last_analysis_stats?: {
            malicious?: number
            suspicious?: number
          }
          last_analysis_results?: Record<string, { category: string; result?: string }>
        }
      }
    }

    const stats = data?.data?.attributes?.last_analysis_stats
    const malicious = stats?.malicious ?? 0
    const suspicious = stats?.suspicious ?? 0

    // Seuil : 3 moteurs ou plus signalent → on bloque (évite les faux positifs)
    if (malicious >= 3) {
      const results = data?.data?.attributes?.last_analysis_results || {}
      const detections = Object.entries(results)
        .filter(([, v]) => v.category === 'malicious')
        .map(([engine]) => engine)
        .slice(0, 5)

      return {
        safe: false,
        malicious,
        detections,
        scanned: true,
      }
    }

    return {
      safe: true,
      malicious: malicious + suspicious,
      scanned: true,
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    if (isTimeout) {
      console.warn('[virustotal] Timeout — scan skippé (failsafe)')
      return { safe: true, scanned: false, skipReason: 'timeout' }
    }
    console.warn('[virustotal] Erreur — scan skippé (failsafe):', err)
    return { safe: true, scanned: false, skipReason: 'error' }
  } finally {
    clearTimeout(timeout)
  }
}
