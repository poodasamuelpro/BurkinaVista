/**
 * app/confidentialite/page.tsx — Politique de Confidentialité
 * RGPD-compatible, claire et complète
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Eye, Database, Trash2, Mail, Lock, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — BurkinaVista',
  description:
    'Comment BurkinaVista collecte, utilise et protège vos données personnelles.',
  robots: { index: true, follow: false },
}

const droits = [
  {
    icon: Eye,
    titre: 'Droit d\'accès',
    desc: 'Vous pouvez demander à consulter toutes les données que nous détenons sur vous.',
  },
  {
    icon: Database,
    titre: 'Droit de rectification',
    desc: 'Vous pouvez demander la correction de vos données inexactes ou incomplètes.',
  },
  {
    icon: Trash2,
    titre: 'Droit à l\'effacement',
    desc: 'Vous pouvez demander la suppression de vos données personnelles (droit à l\'oubli).',
  },
  {
    icon: Lock,
    titre: 'Droit d\'opposition',
    desc: 'Vous pouvez vous opposer au traitement de vos données à tout moment.',
  },
  {
    icon: Globe,
    titre: 'Droit à la portabilité',
    desc: 'Vous pouvez demander vos données dans un format structuré et lisible par machine.',
  },
  {
    icon: Mail,
    titre: 'Désabonnement newsletter',
    desc: 'Chaque email contient un lien de désabonnement. Cliquez-y à tout moment.',
  },
]

const donnéesCollectées = [
  {
    source: 'Contribution d\'un média',
    données: ['Prénom', 'Nom', 'Adresse email', 'Numéro de téléphone (optionnel)'],
    finalité: 'Attribution du crédit, contact en cas de question, envoi de confirmation',
    durée: '5 ans après la dernière contribution',
    base: 'Consentement (lors de la soumission)',
  },
  {
    source: 'Abonnement newsletter',
    données: ['Adresse email', 'Prénom (optionnel)'],
    finalité: 'Envoi de la newsletter hebdomadaire avec les nouveaux médias',
    durée: 'Jusqu\'au désabonnement',
    base: 'Consentement (formulaire d\'abonnement)',
  },
  {
    source: 'Navigation sur le site',
    données: ['Adresse IP (anonymisée)', 'Pages visitées', 'Navigateur et système'],
    finalité: 'Statistiques d\'audience anonymes, amélioration du service',
    durée: '13 mois maximum',
    base: 'Intérêt légitime',
  },
  {
    source: 'Téléchargement d\'un média',
    données: ['Adresse IP (anonymisée)', 'Date et heure', 'Média téléchargé'],
    finalité: 'Statistiques de téléchargement pour les contributeurs',
    durée: '2 ans',
    base: 'Intérêt légitime',
  },
]

export default function ConfidentialitePage() {
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
            <Shield size={14} />
            Protection des données
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
            Politique de Confidentialité
          </h1>
          <div className="faso-divider w-24 mx-auto mb-4" />
          <p className="text-white/30 text-sm">
            Dernière mise à jour : <span className="text-white/50">{dateMAJ}</span>
          </p>
        </div>

        {/* Intro */}
        <div className="card p-6 border border-faso-green/10 mb-10">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-faso-green flex-shrink-0 mt-0.5" />
            <p className="text-white/60 text-sm leading-relaxed">
              BurkinaVista s'engage à protéger votre vie privée. Nous ne collectons que
              les données strictement nécessaires au fonctionnement de la plateforme.
              Nous ne vendons jamais vos données. Nous ne les partageons avec des tiers
              qu'avec votre consentement ou pour des obligations légales.
            </p>
          </div>
        </div>

        {/* Responsable du traitement */}
        <section className="mb-10 scroll-mt-24" id="responsable">
          <h2 className="font-display text-2xl text-white mb-4">
            1. Responsable du traitement
          </h2>
          <div className="card p-6">
            <p className="text-white/50 text-sm leading-relaxed">
              Le responsable du traitement des données personnelles collectées sur
              BurkinaVista est l'équipe BurkinaVista. Pour toute question relative
              à vos données personnelles, vous pouvez nous contacter via la page
              À propos ou directement par email.
            </p>
          </div>
        </section>

        {/* Données collectées */}
        <section className="mb-10 scroll-mt-24" id="donnees">
          <h2 className="font-display text-2xl text-white mb-4">
            2. Données collectées et finalités
          </h2>
          <div className="space-y-4">
            {donnéesCollectées.map(({ source, données, finalité, durée, base }) => (
              <div key={source} className="card p-6">
                <h3 className="font-medium text-faso-gold mb-4">{source}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
                      Données collectées
                    </p>
                    <ul className="space-y-1">
                      {données.map((d) => (
                        <li key={d} className="text-white/60 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-faso-gold flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">
                        Finalité
                      </p>
                      <p className="text-white/60">{finalité}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">
                        Durée de conservation
                      </p>
                      <p className="text-white/60">{durée}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">
                        Base légale
                      </p>
                      <p className="text-white/60">{base}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partage des données */}
        <section className="mb-10 scroll-mt-24" id="partage">
          <h2 className="font-display text-2xl text-white mb-4">
            3. Partage des données avec des tiers
          </h2>
          <div className="card p-6">
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              BurkinaVista utilise des services tiers pour son fonctionnement technique.
              Ces services peuvent avoir accès à certaines données dans le cadre strict
              de leur mission :
            </p>
            <div className="space-y-3">
              {[
                {
                  service: 'Neon (base de données)',
                  usage: 'Stockage sécurisé des métadonnées et informations contributeurs',
                  localisation: 'USA (AWS)',
                  garanties: 'Certifié SOC 2, chiffrement AES-256',
                },
                {
                  service: 'Cloudinary (images)',
                  usage: 'Stockage et optimisation des photos',
                  localisation: 'Multi-régions',
                  garanties: 'Chiffrement SSL/TLS, conformité GDPR',
                },
                {
                  service: 'Cloudflare Stream (vidéos)',
                  usage: 'Stockage et diffusion des vidéos',
                  localisation: 'Multi-régions',
                  garanties: 'Certifié ISO 27001',
                },
                {
                  service: 'Resend (emails)',
                  usage: 'Envoi des emails de confirmation et newsletters',
                  localisation: 'USA',
                  garanties: 'Conformité CAN-SPAM, GDPR',
                },
                {
                  service: 'Vercel (hébergement)',
                  usage: 'Hébergement de l\'application',
                  localisation: 'Multi-régions',
                  garanties: 'Certifié SOC 2 Type 2',
                },
              ].map(({ service, usage, localisation, garanties }) => (
                <div key={service} className="flex flex-col md:flex-row gap-3 p-3 rounded-xl bg-white/3 text-sm">
                  <span className="font-medium text-white md:w-40 flex-shrink-0">{service}</span>
                  <span className="text-white/50 flex-1">{usage}</span>
                  <span className="text-white/30 md:w-28 flex-shrink-0">{localisation}</span>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-5">
              Nous ne vendons, ne louons et ne cédons jamais vos données personnelles
              à des fins commerciales.
            </p>
          </div>
        </section>

        {/* Sécurité */}
        <section className="mb-10 scroll-mt-24" id="securite">
          <h2 className="font-display text-2xl text-white mb-4">
            4. Sécurité des données
          </h2>
          <div className="card p-6">
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données personnelles :
            </p>
            <ul className="space-y-2">
              {[
                'Chiffrement des données en transit (HTTPS/TLS)',
                'Chiffrement des données au repos (AES-256)',
                'Accès administrateur protégé par authentification forte',
                'Mots de passe administrateurs jamais stockés en clair',
                'Tokens d\'accès limités dans le temps (JWT avec expiration)',
                'Sauvegardes régulières de la base de données',
                'Journaux d\'accès et de modifications',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                  <Shield size={13} className="text-faso-green flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-10 scroll-mt-24" id="cookies">
          <h2 className="font-display text-2xl text-white mb-4">
            5. Cookies et technologies similaires
          </h2>
          <div className="card p-6">
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              BurkinaVista utilise un nombre minimal de cookies :
            </p>
            <div className="space-y-3">
              {[
                {
                  nom: 'admin_session',
                  type: 'Fonctionnel (essentiel)',
                  desc: 'Cookie de session administrateur — uniquement pour les admins connectés',
                  duree: '24 heures',
                },
                {
                  nom: 'Statistiques anonymes',
                  type: 'Analytique',
                  desc: 'Comptage anonyme des pages vues et téléchargements, sans identification personnelle',
                  duree: '13 mois',
                },
              ].map(({ nom, type, desc, duree }) => (
                <div key={nom} className="p-4 rounded-xl bg-white/3 text-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-white">{nom}</span>
                    <span className="badge badge-gray text-xs">{type}</span>
                  </div>
                  <p className="text-white/50">{desc}</p>
                  <p className="text-white/30 text-xs mt-1">Durée : {duree}</p>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-4">
              Nous n'utilisons pas de cookies publicitaires ou de suivi cross-site.
            </p>
          </div>
        </section>

        {/* Vos droits */}
        <section className="mb-10 scroll-mt-24" id="droits">
          <h2 className="font-display text-2xl text-white mb-4">
            6. Vos droits sur vos données
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {droits.map(({ icon: Icon, titre, desc }) => (
              <div key={titre} className="card p-5">
                <Icon size={18} className="text-faso-gold mb-3" />
                <h3 className="font-medium text-white text-sm mb-2">{titre}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="card p-5 border border-faso-gold/10">
            <p className="text-white/50 text-sm leading-relaxed">
              Pour exercer l'un de ces droits, contactez-nous via la page À propos
              ou par email en indiquant clairement votre demande et vos coordonnées.
              Nous répondrons dans un délai maximum de 30 jours.
            </p>
          </div>
        </section>

        {/* Mineurs */}
        <section className="mb-10 scroll-mt-24" id="mineurs">
          <h2 className="font-display text-2xl text-white mb-4">
            7. Mineurs
          </h2>
          <div className="card p-6">
            <p className="text-white/50 text-sm leading-relaxed">
              BurkinaVista n'est pas destiné aux enfants de moins de 13 ans.
              Nous ne collectons pas sciemment de données personnelles relatives
              à des mineurs. Si vous pensez qu'un mineur nous a fourni des informations
              personnelles, contactez-nous immédiatement pour que nous les supprimions.
            </p>
          </div>
        </section>

        {/* Modifications */}
        <section className="mb-10 scroll-mt-24" id="modifications">
          <h2 className="font-display text-2xl text-white mb-4">
            8. Modifications de cette politique
          </h2>
          <div className="card p-6">
            <p className="text-white/50 text-sm leading-relaxed">
              Nous pouvons modifier cette politique de confidentialité à tout moment.
              La date de dernière mise à jour est indiquée en haut de cette page.
              En cas de modifications substantielles, nous vous en informerons par
              email (si vous êtes abonné à la newsletter) ou par une notification
              visible sur la plateforme.
            </p>
          </div>
        </section>

        {/* Contact DPO */}
        <div className="card p-8 border border-faso-green/20 bg-faso-green/5 text-center">
          <Shield size={32} className="text-faso-green mx-auto mb-4" />
          <h3 className="font-display text-xl text-white mb-3">
            Questions sur vos données ?
          </h3>
          <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
            Pour toute question ou demande concernant vos données personnelles,
            notre équipe est disponible pour vous répondre.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/about" className="btn-ghost text-sm py-2 px-5">
              Nous contacter
            </Link>
            <Link href="/cgu" className="btn-ghost text-sm py-2 px-5">
              Lire les CGU
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}