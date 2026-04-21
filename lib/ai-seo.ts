/**
 * lib/ai-seo.ts — Génération SEO avec Gemini (Google)
 * Utilise gemini-1.5-flash pour analyser les images et générer des métadonnées SEO
 * Règles strictes : factuel, authentique, pas de clichés ni d'inventions
 * Génère FR + EN en un seul appel Gemini
 *
 * Pour les vidéos : generateSEOFromText() — pas d'analyse IA de la vidéo,
 * uniquement basé sur les informations saisies par le contributeur.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import slugify from 'slugify'
import type { SEOData, UploadFormData } from '@/types'

// Initialisation Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Génère des métadonnées SEO bilingues (FR + EN) à partir d'une image via Gemini Vision
 * Respecte les règles strictes d'authenticité
 */
export async function generateSEOFromImage(
  imageUrl: string,
  userInput: UploadFormData,
  visionData?: Record<string, unknown>
): Promise<SEOData> {
  // Contexte utilisateur fourni
  const userContext = [
    userInput.titre ? `Titre fourni par l'utilisateur : "${userInput.titre}"` : 'Titre : non fourni',
    userInput.description ? `Description fournie : "${userInput.description}"` : 'Description : non fournie',
    userInput.ville ? `Ville : ${userInput.ville}` : '',
    userInput.region ? `Région : ${userInput.region}` : '',
    `Catégorie : ${userInput.categorie}`,
    userInput.tags?.length ? `Tags suggérés : ${userInput.tags.join(', ')}` : '',
  ].filter(Boolean).join('\n')

  // Prompt système strict
  const systemPrompt = `Tu es un assistant SEO spécialisé Burkina Faso.
Tu analyses des images et génères des métadonnées SEO en français ET en anglais.
Tu te bases UNIQUEMENT sur ce que tu vois réellement dans l'image.
Tu n'inventes rien. Tu n'exagères rien. Tu restes factuel et authentique.
Tu améliores le texte fourni par l'utilisateur sans le contredire.
Tu réponds UNIQUEMENT avec du JSON valide, rien d'autre.

RÈGLES ABSOLUES — Tu NE DOIS PAS :
- Inventer une ville non mentionnée par l'utilisateur ou non visible sur l'image
- Ajouter des personnes non visibles sur l'image
- Embellir une réalité non visible sur l'image
- Utiliser des clichés misérabilistes ou condescendants sur l'Afrique
- Dire autre chose que ce qui est réellement visible

Tu DOIS :
- Améliorer le titre si fourni par l'utilisateur, en gardant son sens
- Créer un titre si champ vide, basé uniquement sur ce que tu vois
- Améliorer la description si fournie, en restant factuel
- Mentionner "Burkina Faso" dans les titres FR et EN
- Générer les tags en français ET en anglais pour le SEO international
- Retourner UNIQUEMENT du JSON valide, sans markdown, sans explication`

  const userPrompt = `${userContext}

Génère les métadonnées SEO bilingues pour cette image du Burkina Faso.

Retourne UNIQUEMENT ce JSON valide (sans markdown) :
{
  "titre_fr": "Titre SEO en français, max 70 caractères, contient 'Burkina Faso'",
  "titre_en": "SEO title in English, max 70 chars, contains 'Burkina Faso'",
  "description_fr": "Description précise en français de 150-200 mots, optimisée SEO, décrit UNIQUEMENT ce qui est visible",
  "description_en": "Accurate description in English, 150-200 words, SEO optimized, describes ONLY what is visible",
  "alt_text_fr": "Description courte en français pour accessibilité, max 125 caractères",
  "alt_text_en": "Short English description for accessibility, max 125 characters",
  "tags": ["tag1-fr", "tag1-en", "...jusqu'à 15 tags pertinents en français et anglais mélangés"]
}`

  try {
    // Télécharger l'image pour l'envoyer en base64 à Gemini
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error("Impossible de télécharger l'image")

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Modèle Gemini avec vision
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: contentType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: base64Image,
        },
      },
      { text: userPrompt },
    ])

    const responseText = result.response.text()

    // Nettoyer la réponse (enlever markdown si présent)
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim()
    const seoData = JSON.parse(cleanedResponse)

    // Générer le slug à partir du titre français
    const slug = slugify(seoData.titre_fr || userInput.titre || 'photo-burkina-faso', {
      lower: true,
      strict: true,
      locale: 'fr',
    }).substring(0, 80)

    return {
      titre: seoData.titre_fr || userInput.titre || `Photo Burkina Faso — ${userInput.categorie}`,
      titre_en: seoData.titre_en || null,
      description: seoData.description_fr || userInput.description || `Image du Burkina Faso dans la catégorie ${userInput.categorie}`,
      description_en: seoData.description_en || null,
      alt_text: seoData.alt_text_fr || seoData.titre_fr || 'Photo Burkina Faso',
      alt_text_en: seoData.alt_text_en || null,
      tags: Array.isArray(seoData.tags) ? seoData.tags : [],
      slug: `${slug}-${Date.now()}`,
    }
  } catch (error) {
    console.error('Erreur génération SEO Gemini:', error)
    // Fallback : utiliser les informations de l'utilisateur telles quelles
    return generateFallbackSEO(userInput)
  }
}

/**
 * Génère des métadonnées SEO pour les vidéos
 * Basé UNIQUEMENT sur les informations saisies par le contributeur
 * Pas d'analyse IA de la vidéo — traitement déterministe et instantané
 */
export function generateSEOFromText(userInput: UploadFormData): SEOData {
  const titreFr = userInput.titre
    ? `${userInput.titre} — Burkina Faso`
    : `${userInput.categorie} — Burkina Faso`

  const titreEn = userInput.titre
    ? `${userInput.titre} — Burkina Faso`
    : `${userInput.categorie} — Burkina Faso`

  const descriptionFr = userInput.description
    ? `${userInput.description}${userInput.ville ? ` — ${userInput.ville}` : ''}${userInput.region ? `, ${userInput.region}` : ''}, Burkina Faso.`
    : `Vidéo du Burkina Faso dans la catégorie ${userInput.categorie}${userInput.ville ? `, filmée à ${userInput.ville}` : ''}. Découvrez la richesse visuelle du Burkina Faso sur BurkinaVista.`

  const descriptionEn = userInput.description
    ? `${userInput.description}${userInput.ville ? ` — ${userInput.ville}` : ''}${userInput.region ? `, ${userInput.region}` : ''}, Burkina Faso.`
    : `Video from Burkina Faso in the ${userInput.categorie} category${userInput.ville ? `, filmed in ${userInput.ville}` : ''}. Discover the visual richness of Burkina Faso on BurkinaVista.`

  // Construction des tags depuis les infos contributeur
  const tagsBase = [
    'Burkina Faso',
    "Afrique de l'Ouest",
    'West Africa',
    userInput.categorie,
    ...(userInput.ville ? [userInput.ville] : []),
    ...(userInput.region ? [userInput.region] : []),
    ...(userInput.tags ?? []),
    'vidéo',
    'video',
    'BurkinaVista',
  ].filter(Boolean)

  // Déduplication
  const tags = [...new Set(tagsBase)]

  const slug = slugify(titreFr, {
    lower: true,
    strict: true,
    locale: 'fr',
  }).substring(0, 80)

  return {
    titre: titreFr,
    titre_en: titreEn,
    description: descriptionFr,
    description_en: descriptionEn,
    alt_text: titreFr,
    alt_text_en: titreEn,
    tags,
    slug: `${slug}-${Date.now()}`,
  }
}

/**
 * Fallback si l'IA échoue : utiliser les infos utilisateur telles quelles
 */
function generateFallbackSEO(
  userInput: UploadFormData & { titre?: string; description?: string; ville?: string }
): SEOData {
  const titreFallback = userInput.titre
    ? `${userInput.titre} — Burkina Faso`
    : `${userInput.categorie} — Burkina Faso`

  const titreFallbackEn = userInput.titre
    ? `${userInput.titre} — Burkina Faso`
    : `${userInput.categorie} — Burkina Faso`

  const slug = slugify(titreFallback, {
    lower: true,
    strict: true,
    locale: 'fr',
  }).substring(0, 80)

  return {
    titre: titreFallback,
    titre_en: titreFallbackEn,
    description: userInput.description
      ? `${userInput.description} — Burkina Faso, ${userInput.categorie}.`
      : `Image du Burkina Faso dans la catégorie ${userInput.categorie}. Découvrez la richesse visuelle du Burkina Faso sur BurkinaVista.`,
    description_en: userInput.description
      ? `${userInput.description} — Burkina Faso, ${userInput.categorie}.`
      : `Photo from Burkina Faso in the ${userInput.categorie} category. Discover the visual richness of Burkina Faso on BurkinaVista.`,
    alt_text: titreFallback,
    alt_text_en: titreFallbackEn,
    tags: [
      'Burkina Faso',
      "Afrique de l'ouest",
      userInput.categorie,
      userInput.ville || '',
      'West Africa',
      'photography',
    ].filter(Boolean),
    slug: `${slug}-${Date.now()}`,
  }
}
