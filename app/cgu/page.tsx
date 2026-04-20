/**
 * app/cgu/page.tsx — Conditions Générales d'Utilisation
 * Dernière mise à jour dynamique
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, AlertTriangle, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — BurkinaVista',
  description:
    'Conditions Générales d\'Utilisation de BurkinaVista, la bibliothèque visuelle libre du Burkina Faso.',
  robots: { index: true, follow: false },
}

const sections = [
  {
    id: 'objet',
    titre: '1. Objet et champ d\'application',
    contenu: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme BurkinaVista, accessible à l'adresse burkina-vista.vercel.app et ses éventuels sous-domaines.

BurkinaVista est une bibliothèque visuelle libre dédiée au Burkina Faso, permettant à toute personne de consulter, télécharger et contribuer des photos et vidéos authentiques du pays, sous licences Creative Commons.

En accédant à BurkinaVista, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous devez cesser immédiatement d'utiliser la plateforme.`,
  },
  {
    id: 'acces',
    titre: '2. Accès à la plateforme',
    contenu: `L'accès à BurkinaVista est libre et gratuit pour tout utilisateur disposant d'un accès à Internet. Aucune inscription n'est requise pour consulter et télécharger les médias.

La contribution de photos ou vidéos est accessible sans création de compte. L'utilisateur fournit son nom, prénom et adresse email lors de la soumission d'un média. Ces informations sont nécessaires pour attribuer le crédit de l'œuvre et vous contacter en cas de besoin.

BurkinaVista se réserve le droit de suspendre ou d'interrompre l'accès à tout ou partie de la plateforme pour des raisons de maintenance, de sécurité ou toute autre raison jugée nécessaire, sans préavis ni indemnité.`,
  },
  {
    id: 'contributions',
    titre: '3. Contributions et droits des auteurs',
    contenu: `3.1 Conditions de contribution
En soumettant un média (photo ou vidéo) sur BurkinaVista, vous déclarez et garantissez :
• Être l'auteur original de l'œuvre soumise ou détenir tous les droits nécessaires à sa publication
• Que l'œuvre ne porte pas atteinte aux droits de tiers (droits d'auteur, droits à l'image, droits de propriété)
• Que l'œuvre ne contient pas de contenu illicite, offensant, diffamatoire ou contraire à l'ordre public
• Que les personnes représentées ont donné leur consentement à la publication de leur image

3.2 Licence accordée à BurkinaVista
En soumettant un média, vous accordez à BurkinaVista une licence mondiale, non exclusive, gratuite et perpétuelle pour héberger, afficher, reproduire et distribuer votre œuvre dans le cadre des missions de la plateforme.

3.3 Licence accordée aux utilisateurs
Vous choisissez librement la licence Creative Commons applicable à chaque média soumis. Cette licence détermine les droits accordés aux autres utilisateurs de la plateforme (voir page Licences).

3.4 Modération
Toute contribution est soumise à modération avant publication. BurkinaVista se réserve le droit de refuser, modifier ou supprimer tout contenu qui ne respecterait pas les présentes CGU, sans obligation de motivation.`,
  },
  {
    id: 'utilisation',
    titre: '4. Utilisation des médias',
    contenu: `Les médias disponibles sur BurkinaVista sont soumis aux licences Creative Commons choisies par leurs auteurs. En téléchargeant un média, vous vous engagez à respecter les conditions de la licence applicable, clairement indiquée sur la page de chaque média.

L'utilisation d'un média en dehors des conditions prévues par sa licence constitue une violation du droit d'auteur et engage votre responsabilité.

BurkinaVista n'est pas responsable de l'usage que vous faites des médias téléchargés. Il vous appartient de vérifier la compatibilité de la licence avec votre usage avant toute utilisation.

Tout usage commercial d'un média soumis sous licence CC BY-NC (Attribution — Pas d'utilisation commerciale) est strictement interdit.`,
  },
  {
    id: 'interdits',
    titre: '5. Contenus et comportements interdits',
    contenu: `Il est strictement interdit sur BurkinaVista de :

• Soumettre des contenus à caractère pornographique, pédopornographique ou sexuellement explicite
• Publier des contenus incitant à la haine, à la discrimination ou à la violence
• Soumettre des images portant atteinte à la dignité des personnes représentées
• Publier des contenus dont vous n'êtes pas l'auteur sans autorisation
• Tenter de contourner les mesures de sécurité de la plateforme
• Utiliser des robots ou systèmes automatisés pour extraire massivement les données
• Usurper l'identité d'un autre contributeur ou tiers
• Publier des informations fausses ou trompeuses sur l'origine ou le contenu d'un média
• Utiliser la plateforme à des fins publicitaires ou commerciales sans accord préalable

Tout manquement à ces règles entraîne la suppression immédiate du contenu et peut donner lieu à des poursuites judiciaires.`,
  },
  {
    id: 'donnees',
    titre: '6. Données personnelles',
    contenu: `BurkinaVista collecte et traite les données personnelles que vous fournissez lors de la contribution d'un média (nom, prénom, email, téléphone optionnel) ainsi que lors de l'abonnement à la newsletter (email, prénom).

Ces données sont utilisées exclusivement pour :
• Attribuer le crédit de vos œuvres
• Vous contacter en cas de question sur votre contribution
• Vous envoyer la newsletter si vous y avez consenti

Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.

Pour plus d'informations sur le traitement de vos données, consultez notre Politique de Confidentialité.`,
  },
  {
    id: 'responsabilite',
    titre: '7. Limitation de responsabilité',
    contenu: `BurkinaVista est fourni "en l'état", sans garantie d'aucune sorte, expresse ou implicite. Nous ne garantissons pas :
• La disponibilité permanente et ininterrompue de la plateforme
• L'absence d'erreurs, de bugs ou d'interruptions de service
• L'exactitude exhaustive des informations présentées

BurkinaVista ne saurait être tenu responsable :
• Des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme
• Des contenus publiés par les contributeurs
• De la violation des licences CC par les utilisateurs
• De tout litige entre contributeurs et utilisateurs concernant les droits sur les œuvres

La responsabilité de BurkinaVista ne peut être engagée qu'en cas de faute lourde ou de dol avéré.`,
  },
  {
    id: 'propriete',
    titre: '8. Propriété intellectuelle',
    contenu: `L'ensemble des éléments constituant BurkinaVista (design, interface, code source, logo, textes) sont la propriété exclusive de BurkinaVista et sont protégés par les lois relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification ou exploitation non autorisée de ces éléments est strictement interdite.

Les médias publiés sur la plateforme restent la propriété de leurs auteurs respectifs et sont soumis aux licences Creative Commons choisies lors de la contribution.`,
  },
  {
    id: 'modification',
    titre: '9. Modification des CGU',
    contenu: `BurkinaVista se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la plateforme.

Nous vous informons des modifications importantes par email (si vous êtes abonné à la newsletter) ou par une notification visible sur la plateforme.

Votre utilisation continue de BurkinaVista après la modification des CGU vaut acceptation des nouvelles conditions.`,
  },
  {
    id: 'droit',
    titre: '10. Droit applicable et juridiction',
    contenu: `Les présentes CGU sont régies par le droit burkinabè. Tout litige relatif à l'interprétation ou à l'exécution des présentes CGU sera soumis aux tribunaux compétents du Burkina Faso, sauf disposition légale contraire applicable.

En cas de litige, nous privilégions une résolution amiable. Vous pouvez nous contacter à tout moment avant toute action en justice.`,
  },
]

export default function CGUPage() {
  const dateMAJ = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 badge badge-gray mb-6">
            <FileText size={14} />
            Document légal
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <div className="faso-divider w-24 mx-auto mb-4" />
          <p className="text-white/30 text-sm">
            Dernière mise à jour : <span className="text-white/50">{dateMAJ}</span>
          </p>
        </div>

        {/* Résumé rapide */}
        <div className="card p-6 border border-faso-gold/10 mb-10">
          <h2 className="font-medium text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-faso-gold" />
            Résumé en langage simple
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { emoji: '✅', text: 'L\'accès et le téléchargement sont gratuits et sans inscription' },
              { emoji: '✅', text: 'Vous pouvez contribuer sans créer de compte' },
              { emoji: '✅', text: 'Chaque image peut être utilisée selon sa licence CC' },
              { emoji: '❌', text: 'Ne soumettez pas d\'images dont vous n\'êtes pas l\'auteur' },
              { emoji: '❌', text: 'Pas de contenu illicite, offensant ou portant atteinte à la dignité' },
              { emoji: '❌', text: 'Respectez la licence de chaque image lors de son utilisation' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-start gap-2 text-sm text-white/50">
                <span className="flex-shrink-0">{emoji}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Table des matières */}
        <nav className="card p-5 mb-10">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Sommaire</p>
          <ul className="space-y-1">
            {sections.map(({ id, titre }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-sm text-white/50 hover:text-faso-gold transition-colors"
                >
                  {titre}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map(({ id, titre, contenu }) => (
            <section key={id} id={id} className="scroll-mt-24">
              <h2 className="font-display text-xl text-white mb-4">{titre}</h2>
              <div className="card p-6">
                <div className="text-white/50 text-sm leading-relaxed whitespace-pre-line">
                  {contenu}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 card p-6 border border-white/10 text-center">
          <Mail size={24} className="text-faso-gold mx-auto mb-3" />
          <h3 className="font-medium text-white mb-2">Une question sur nos CGU ?</h3>
          <p className="text-white/40 text-sm mb-4">
            Nous sommes disponibles pour répondre à vos questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/about" className="btn-ghost text-sm py-2 px-5">
              Nous contacter
            </Link>
            <Link href="/confidentialite" className="btn-ghost text-sm py-2 px-5">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}