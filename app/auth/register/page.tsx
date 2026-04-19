'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    if (!nom || !email || !password) return toast.error('Remplissez tous les champs')
    if (password.length < 6) return toast.error('Mot de passe trop court (min 6 caractères)')

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom } },
    })

    if (error) {
      toast.error(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-md animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-faso-green/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-faso-green" />
          </div>
          <h2 className="font-display text-3xl text-white mb-4">Vérifiez votre email</h2>
          <p className="text-white/50 mb-8">
            Un lien de confirmation a été envoyé à <strong className="text-white">{email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link href="/auth/login" className="btn-gold">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-faso-green/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-faso-gold/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="h-1/3 bg-faso-red" />
                <div className="h-1/3 bg-faso-gold" />
                <div className="h-1/3 bg-faso-green" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3.5 h-3.5 faso-star bg-white" />
              </div>
            </div>
            <span className="font-display text-2xl font-bold text-white">FasoStock</span>
          </Link>
          <h1 className="font-display text-3xl text-white mt-6 mb-2">Créer un compte</h1>
          <p className="text-white/40 text-sm">Rejoignez la communauté des contributeurs</p>
        </div>

        <div className="card p-8 border border-white/10">
          <div className="space-y-4 mb-6">
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom"
                className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe (min 6 caractères)"
                className="input-field pl-11 pr-11"
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full btn-primary justify-center py-3"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-xs text-white/20 mt-4">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/cgu" className="text-faso-gold hover:underline">CGU</Link>
          </p>

          <p className="text-center text-sm text-white/30 mt-4">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-faso-gold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
