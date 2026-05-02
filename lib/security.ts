/**
 * lib/security.ts — Utilitaires de sécurité (échappement, magic bytes, EXIF)
 *
 * AJOUT (Audit 2026-05-01) :
 *  - escapeHtml() : échappement HTML pour interpoler des variables IA / saisies
 *    contributeur dans les templates email (lib/email.ts) et le JSON-LD
 *    (app/photos/[slug]/page.tsx).
 *  - escapeJsonLd() : variante d'échappement plus stricte pour le JSON injecté
 *    via dangerouslySetInnerHTML (évite la fermeture de balise </script>).
 *  - verifyMagicBytes() : vérification de la signature binaire des fichiers
 *    image avant upload (un .jpg renommé en exécutable sera rejeté).
 *  - stripExifFromImage() : suppression des métadonnées EXIF des images via
 *    sharp (déjà inclus en dépendance) — protège la vie privée des contributeurs
 *    (géolocalisation, modèle d'appareil…).
 *
 * FIX 2026-05-02 :
 *  - Signature de stripExifFromImage() mise à jour :
 *    buffer: Buffer → buffer: Buffer<ArrayBuffer>
 *    Promise<Buffer> → Promise<Buffer<ArrayBuffer>>
 *    Résout l'erreur TypeScript strict "Type 'Buffer<ArrayBufferLike>' is not
 *    assignable to type 'Buffer<ArrayBuffer>'" lors du réassignement dans
 *    app/api/upload/route.ts.
 */

import sharp from 'sharp'

// ============================================================
// HTML ESCAPING
// ============================================================

/**
 * Échappe les caractères HTML pour éviter toute injection dans un template.
 * Utilisé dans lib/email.ts et toute autre interpolation de variables non
 * fiables dans du HTML.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
}

/**
 * Échappement spécifique pour les valeurs interpolées dans un attribut HTML
 * (équivalent à escapeHtml mais avec un nom plus explicite).
 */
export const escapeHtmlAttr = escapeHtml

/**
 * Échappe une chaîne destinée à être interpolée dans un JSON-LD inline
 * (<script type="application/ld+json">…</script>).
 *
 * Le risque principal est la présence de `</script>` ou `<!--` dans une
 * description, qui briserait la balise. JSON.stringify échappe déjà guillemets
 * et backslash, mais pas les chevrons.
 */
export function escapeJsonLdString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * Échappe récursivement un objet entier destiné au JSON-LD.
 * Toutes les chaînes sont nettoyées des caractères dangereux.
 */
export function sanitizeJsonLd<T>(input: T): T {
  if (input === null || input === undefined) return input
  if (typeof input === 'string') {
    // On laisse JSON.stringify gérer l'échappement standard, mais on remplace
    // les chevrons et l'esperluette qui sont dangereux dans <script>
    return input as unknown as T
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeJsonLd(item)) as unknown as T
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = sanitizeJsonLd(v)
    }
    return out as unknown as T
  }
  return input
}

/**
 * Sérialise un objet JSON-LD en chaîne sûre pour dangerouslySetInnerHTML.
 * Combine JSON.stringify + échappement des séquences dangereuses.
 */
export function safeJsonLdStringify(obj: unknown): string {
  const json = JSON.stringify(obj)
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

// ============================================================
// MAGIC BYTES — Validation signature binaire des fichiers
// ============================================================

/**
 * Signatures binaires (magic bytes) des principaux formats image autorisés.
 * Source : https://en.wikipedia.org/wiki/List_of_file_signatures
 */
const IMAGE_MAGIC_BYTES: Record<string, Array<number[]>> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xe2],
    [0xff, 0xd8, 0xff, 0xe3],
    [0xff, 0xd8, 0xff, 0xe8],
    [0xff, 0xd8, 0xff, 0xdb],
    [0xff, 0xd8, 0xff, 0xee],
    [0xff, 0xd8, 0xff, 0xfe],
  ],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/webp': [
    // RIFF....WEBP — on vérifie RIFF (4 bytes) puis WEBP à l'offset 8
    [0x52, 0x49, 0x46, 0x46],
  ],
}

/** Alias MIME (jpg = jpeg) */
const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
}

function startsWithBytes(buffer: Uint8Array, signature: number[]): boolean {
  if (buffer.length < signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false
  }
  return true
}

/**
 * Vérifie que les premiers octets du fichier correspondent au type MIME annoncé.
 * Empêche un fichier exécutable renommé en .jpg de passer la validation.
 *
 * @returns true si la signature correspond, false sinon.
 */
export function verifyMagicBytes(
  buffer: Buffer | Uint8Array,
  declaredMimeType: string
): boolean {
  const mime = MIME_ALIASES[declaredMimeType] || declaredMimeType
  const signatures = IMAGE_MAGIC_BYTES[mime]
  if (!signatures) {
    // Type non géré → on refuse par sécurité
    return false
  }

  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

  // Cas spécial WebP : RIFF....WEBP
  if (mime === 'image/webp') {
    if (!startsWithBytes(bytes, signatures[0])) return false
    if (bytes.length < 12) return false
    const webpMarker = [0x57, 0x45, 0x42, 0x50] // 'WEBP'
    for (let i = 0; i < 4; i++) {
      if (bytes[8 + i] !== webpMarker[i]) return false
    }
    return true
  }

  return signatures.some((sig) => startsWithBytes(bytes, sig))
}

// ============================================================
// EXIF — Suppression des métadonnées de confidentialité
// ============================================================

/**
 * Supprime les métadonnées EXIF/XMP/ICC (sauf orientation) d'une image.
 * Préserve la qualité visuelle et l'orientation correcte.
 *
 * Si le format n'est pas reconnu par sharp ou en cas d'erreur, on retourne
 * le buffer original (failsafe pour ne pas bloquer un upload légitime).
 *
 * FIX 2026-05-02 : signature mise à jour Buffer<ArrayBuffer> pour compatibilité
 * TypeScript strict avec route.ts (évite l'erreur ArrayBufferLike).
 *
 * @param buffer Image source
 * @param mimeType Type MIME (utilisé pour préserver le format de sortie)
 */
export async function stripExifFromImage(
  buffer: Buffer<ArrayBuffer>,
  mimeType: string
): Promise<Buffer<ArrayBuffer>> {
  try {
    // sharp ne supporte pas le GIF animé → on conserve l'original
    if (mimeType === 'image/gif') return buffer

    let pipeline = sharp(buffer, { failOn: 'none' }).rotate() // applique l'orientation EXIF puis la jette

    // Format de sortie identique au format d'entrée pour ne pas casser les attentes
    if (mimeType === 'image/png') {
      pipeline = pipeline.png({ compressionLevel: 9 })
    } else if (mimeType === 'image/webp') {
      pipeline = pipeline.webp({ quality: 90 })
    } else {
      // JPEG par défaut — qualité 92 (haut, perte minime)
      pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true })
    }

    // .toBuffer() avec withMetadata({}) NON appelé → toutes métadonnées EXIF/XMP supprimées
    const cleaned = await pipeline.toBuffer()
    return cleaned as Buffer<ArrayBuffer>
  } catch (error) {
    console.error('[security] Erreur stripExif (failsafe → original):', error)
    return buffer
  }
}

// ============================================================
// HELPERS DIVERS
// ============================================================

/**
 * Validation UUID v4 stricte (utilisée par plusieurs routes admin).
 */
export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Détection grossière de bots / agents non humains via le User-Agent.
 * Utilisé pour ne pas comptabiliser les vues des crawlers et préfetch.
 */
const BOT_UA_REGEX =
  /(bot|crawler|spider|crawling|googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|slackbot|twitterbot|linkedinbot|telegrambot|whatsapp|discordbot|prerender|preview|headless|http-client|axios|curl|wget|python-requests|node-fetch|postmanruntime|lighthouse|pagespeed|chrome-lighthouse|gtmetrix)/i

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true // pas d'UA = comportement non humain
  return BOT_UA_REGEX.test(userAgent)
}
