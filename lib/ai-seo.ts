import Anthropic from '@anthropic-ai/sdk'
import slugify from 'slugify'
import { SEOData, UploadFormData } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateSEOFromImage(
  imageUrl: string,
  userInput: UploadFormData,
  googleVisionData?: GoogleVisionResult
): Promise<SEOData> {
  const visionContext = googleVisionData
    ? `
Analyse visuelle de l'image (Google Vision):
- Labels détectés: ${googleVisionData.labels?.join(', ')}
- Objets détectés: ${googleVisionData.objects?.join(', ')}
- Texte détecté: ${googleVisionData.text || 'aucun'}
- Couleurs dominantes: ${googleVisionData.colors?.join(', ')}
    `
    : ''

  const userContext = `
Informations fournies par l'utilisateur:
- Titre: ${userInput.titre || 'non fourni'}
- Description: ${userInput.description || 'non fournie'}
- Ville: ${userInput.ville || 'non fournie'}
- Région: ${userInput.region || 'non fournie'}
- Catégorie: ${userInput.categorie}
  `

  const prompt = `Tu es un expert SEO spécialisé dans la culture et le patrimoine du Burkina Faso.

${visionContext}
${userContext}

Ta mission: Génère des métadonnées SEO précises et optimisées pour cette image/vidéo du Burkina Faso.

RÈGLES IMPORTANTES:
1. Ne jamais inventer des informations non visibles dans l'image
2. Si l'utilisateur a fourni des infos, améliore-les sans les contredire
3. Utilise des mots-clés pertinents en français ET en anglais pour le SEO international
4. Mentionne "Burkina Faso" dans le titre et la description
5. Sois précis et authentique - pas de clichés misérabilistes

Réponds UNIQUEMENT avec ce JSON valide (sans markdown):
{
  "titre": "Titre optimisé SEO, max 70 caractères, inclut Burkina Faso",
  "description": "Description riche et précise de 150-200 mots, optimisée SEO, décrit ce qui est réellement visible",
  "alt_text": "Description courte pour accessibilité, max 125 caractères",
  "tags": ["tag1", "tag2", "tag3", "...jusqu'à 15 tags pertinents en français et anglais"]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrl },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Réponse IA invalide')

    const seoData = JSON.parse(content.text.replace(/```json|```/g, '').trim())

    const slug = slugify(seoData.titre, {
      lower: true,
      strict: true,
      locale: 'fr',
    }).substring(0, 80)

    return {
      titre: seoData.titre,
      description: seoData.description,
      alt_text: seoData.alt_text,
      tags: seoData.tags,
      slug: `${slug}-${Date.now()}`,
    }
  } catch (error) {
    console.error('Erreur génération SEO:', error)
    // Fallback basique
    const fallbackTitre = userInput.titre || `Photo Burkina Faso - ${userInput.categorie}`
    return {
      titre: fallbackTitre,
      description: userInput.description || `Image du Burkina Faso dans la catégorie ${userInput.categorie}`,
      alt_text: fallbackTitre,
      tags: ['Burkina Faso', 'Afrique de l\'ouest', userInput.categorie, userInput.ville || ''].filter(Boolean),
      slug: `${slugify(fallbackTitre, { lower: true, strict: true })}-${Date.now()}`,
    }
  }
}

export interface GoogleVisionResult {
  labels?: string[]
  objects?: string[]
  text?: string
  colors?: string[]
}

export async function analyzeWithGoogleVision(
  imageUrl: string
): Promise<GoogleVisionResult> {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: imageUrl } },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
                { type: 'TEXT_DETECTION', maxResults: 1 },
                { type: 'IMAGE_PROPERTIES', maxResults: 5 },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()
    const result = data.responses[0]

    return {
      labels: result.labelAnnotations?.map((l: any) => l.description) || [],
      objects: result.localizedObjectAnnotations?.map((o: any) => o.name) || [],
      text: result.textAnnotations?.[0]?.description || '',
      colors:
        result.imagePropertiesAnnotation?.dominantColors?.colors?.map(
          (c: any) =>
            `rgb(${Math.round(c.color.red)},${Math.round(c.color.green)},${Math.round(c.color.blue)})`
        ) || [],
    }
  } catch (error) {
    console.error('Erreur Google Vision:', error)
    return {}
  }
}
