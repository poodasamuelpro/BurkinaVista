/**
 * lib/ai-seo.ts — Génération SEO avec Gemini (Google)
 * Utilise gemini-1.5-flash pour analyser les images et générer des métadonnées SEO
 * Règles strictes : factuel, authentique, pas de clichés ni d'inventions
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import slugify from 'slugify'
import type { SEOData, UploadFormData } from '@/types'

// Initialisation Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Génère des métadonnées SEO à partir d'une image via Gemini Vision
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
Tu analyses des images et génères des métadonnées SEO.
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
- Mentionner "Burkina Faso" dans le titre ET dans la description
- Générer des tags en français ET en anglais pour le SEO international
- Retourner UNIQUEMENT du JSON valide, sans markdown, sans explication`

  const userPrompt = `${userContext}

Génère les métadonnées SEO pour cette image du Burkina Faso.

Retourne UNIQUEMENT ce JSON valide (sans markdown) :
{
  "titre": "Titre SEO optimisé, max 70 caractères, contient 'Burkina Faso'",
  "description": "Description précise de 150-200 mots, optimisée SEO, décrit UNIQUEMENT ce qui est visible",
  "alt_text": "Description courte pour accessibilité, max 125 caractères",
  "tags": ["tag1-fr", "tag2-en", "...jusqu'à 15 tags pertinents en français et anglais"]
}`

  try {
    // Télécharger l'image pour l'envoyer en base64 à Gemini
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error('Impossible de télécharger l\'image')

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

    // Générer le slug à partir du titre
    const slug = slugify(seoData.titre || userInput.titre || 'photo-burkina-faso', {
      lower: true,
      strict: true,
      locale: 'fr',
    }).substring(0, 80)

    return {
      titre: seoData.titre || userInput.titre || `Photo Burkina Faso — ${userInput.categorie}`,
      description: seoData.description || userInput.description || `Image du Burkina Faso dans la catégorie ${userInput.categorie}`,
      alt_text: seoData.alt_text || seoData.titre || `Photo Burkina Faso`,
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
 * Génère des métadonnées SEO pour une vidéo (texte uniquement, sans vision)
 */
export async function generateSEOFromText(
  userInput: UploadFormData & { titre?: string; description?: string; ville?: string; region?: string }
): Promise<SEOData> {
  const systemPrompt = `Tu es un assistant SEO spécialisé Burkina Faso.
Tu génères des métadonnées SEO pour des vidéos basées sur les informations fournies.
Tu restes factuel, authentique, pas de clichés.
Tu réponds UNIQUEMENT avec du JSON valide.`

  const userPrompt = `Génère des métadonnées SEO pour cette vidéo du Burkina Faso :
- Titre fourni : "${userInput.titre || 'non fourni'}"
- Description fournie : "${userInput.description || 'non fournie'}"
- Ville : "${userInput.ville || 'non fournie'}"
- Région : "${userInput.region || 'non fournie'}"
- Catégorie : "${userInput.categorie}"

Retourne UNIQUEMENT ce JSON :
{
  "titre": "Titre SEO, max 70 caractères, contient 'Burkina Faso'",
  "description": "Description 150-200 mots, optimisée SEO, factuelle",
  "alt_text": "Description courte, max 125 caractères",
  "tags": ["tag1-fr", "tag2-en", "...jusqu'à 15 tags"]
}`

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent(userPrompt)
    const responseText = result.response.text()
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim()
    const seoData = JSON.parse(cleanedResponse)

    const slug = slugify(seoData.titre || userInput.titre || 'video-burkina-faso', {
      lower: true,
      strict: true,
      locale: 'fr',
    }).substring(0, 80)

    return {
      titre: seoData.titre || userInput.titre || `Vidéo Burkina Faso — ${userInput.categorie}`,
      description: seoData.description || userInput.description || `Vidéo du Burkina Faso dans la catégorie ${userInput.categorie}`,
      alt_text: seoData.alt_text || seoData.titre || 'Vidéo Burkina Faso',
      tags: Array.isArray(seoData.tags) ? seoData.tags : [],
      slug: `${slug}-${Date.now()}`,
    }
  } catch (error) {
    console.error('Erreur génération SEO texte Gemini:', error)
    return generateFallbackSEO(userInput)
  }
}

/**
 * Fallback si l'IA échoue : utiliser les infos utilisateur telles quelles
 */
function generateFallbackSEO(userInput: UploadFormData & { titre?: string; description?: string; ville?: string }): SEOData {
  const titreFallback = userInput.titre
    ? `${userInput.titre} — Burkina Faso`
    : `${userInput.categorie} — Burkina Faso`

  const slug = slugify(titreFallback, {
    lower: true,
    strict: true,
    locale: 'fr',
  }).substring(0, 80)

  return {
    titre: titreFallback,
    description: userInput.description
      ? `${userInput.description} — Burkina Faso, ${userInput.categorie}.`
      : `Image du Burkina Faso dans la catégorie ${userInput.categorie}. Découvrez la richesse visuelle du Burkina Faso sur BurkinaVista.`,
    alt_text: titreFallback,
    tags: [
      'Burkina Faso',
      'Afrique de l\'ouest',
      userInput.categorie,
      userInput.ville || '',
      'West Africa',
      'photography',
    ].filter(Boolean),
    slug: `${slug}-${Date.now()}`,
  }
}
