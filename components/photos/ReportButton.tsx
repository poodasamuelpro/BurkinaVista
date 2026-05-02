'use client'
/**
 * components/photos/ReportButton.tsx
 *
 * CORRECTION (2026-05-02) — Option C :
 *  - Email OBLIGATOIRE pour motifs `copyright` et `illegal` (conséquences légales)
 *  - Email OPTIONNEL pour tous les autres motifs
 *  - Message contextuel sous le champ email selon le motif sélectionné
 *  - Validation côté client bloquant le submit si email manquant sur motifs critiques
 *  - Les clés i18n utilisées sont alignées avec fr.json / en.json
 */
import { useEffect, useState, useRef } from 'react'
import { Flag, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

interface Props {
  mediaId: string
}

const REASONS = ['inappropriate', 'copyright', 'incorrect_info', 'spam', 'illegal', 'other'] as const
type Reason = typeof REASONS[number]

/** Motifs pour lesquels l'email devient obligatoire */
const EMAIL_REQUIRED_REASONS: Reason[] = ['copyright', 'illegal']

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, opts: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY)

export default function ReportButton({ mediaId }: Props) {
  const t = useTranslations('report')
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason>('inappropriate')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)

  const isEmailRequired = EMAIL_REQUIRED_REASONS.includes(reason)

  // Reset emailError quand le motif change
  useEffect(() => {
    setEmailError('')
  }, [reason])

  // Chargement script Turnstile
  useEffect(() => {
    if (!open || !TURNSTILE_ENABLED) return
    if (typeof window === 'undefined') return

    const SCRIPT_ID = 'cf-turnstile-script'
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      s.id = SCRIPT_ID
      document.head.appendChild(s)
    }

    const tryRender = () => {
      if (!window.turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) return
      try {
        const id = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          size: 'flexible',
          callback: (token: string) => setTurnstileToken(token),
          'error-callback': () => setTurnstileToken(null),
          'expired-callback': () => setTurnstileToken(null),
        })
        turnstileWidgetIdRef.current = id
      } catch (err) {
        console.error('[Turnstile] render error:', err)
      }
    }

    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval)
        tryRender()
      }
    }, 200)

    return () => {
      clearInterval(interval)
      if (window.turnstile && turnstileWidgetIdRef.current) {
        try { window.turnstile.remove(turnstileWidgetIdRef.current) } catch {}
        turnstileWidgetIdRef.current = null
      }
    }
  }, [open])

  const reset = () => {
    setReason('inappropriate')
    setMessage('')
    setEmail('')
    setEmailError('')
    setStatus('idle')
    setErrorMsg('')
    setTurnstileToken(null)
  }

  const validateEmail = (val: string): boolean => {
    if (!isEmailRequired) return true
    if (!val.trim()) {
      setEmailError(t('email_required_notice'))
      return false
    }
    // Validation basique format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val.trim())) {
      setEmailError(t('email_invalid'))
      return false
    }
    setEmailError('')
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError) {
      // Re-valider à la volée si l'utilisateur corrige
      if (e.target.value.trim()) setEmailError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'loading') return

    // Validation client : email obligatoire pour motifs critiques
    if (!validateEmail(email)) return

    setStatus('loading')
    setErrorMsg('')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (turnstileToken) headers['X-Turnstile-Token'] = turnstileToken

      const res = await fetch('/api/report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mediaId,
          reason,
          message: message.trim() || undefined,
          email: email.trim() || undefined,
          turnstileToken: turnstileToken || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || t('error_generic'))
        return
      }
      setStatus('success')
      toast.success(t('success_title'))
      setTimeout(() => { setOpen(false); reset() }, 1800)
    } catch {
      setStatus('error')
      setErrorMsg(t('error_generic'))
    }
  }

  // Détermine si le bouton submit doit être désactivé
  const isSubmitDisabled =
    status === 'loading' ||
    (TURNSTILE_ENABLED && !turnstileToken) ||
    (isEmailRequired && !email.trim())

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-faso-red transition-colors"
        title={t('button')}
      >
        <Flag size={13} />
        {t('button')}
      </button>
    )
  }

  return (
    <div className="card p-5 border border-faso-red/20 bg-faso-red/5 mt-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-medium text-white flex items-center gap-2">
            <Flag size={15} className="text-faso-red" />
            {t('title')}
          </h3>
          <p className="text-xs text-white/50 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setOpen(false); reset() }}
          className="text-white/40 hover:text-white transition-colors"
          aria-label={t('cancel')}
        >
          <X size={18} />
        </button>
      </div>

      {status === 'success' ? (
        <div className="text-center py-6">
          <CheckCircle size={32} className="text-faso-green mx-auto mb-2" />
          <p className="text-sm text-white/70">{t('success_desc')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Motifs */}
          <div>
            <label className="block text-xs text-white/60 mb-2">{t('reason_label')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs transition-all ${
                    reason === r
                      ? 'bg-faso-red/10 border border-faso-red/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-faso-red"
                  />
                  <span className="text-white/80">{t(`reason_${r}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message libre */}
          <div>
            <label className="block text-xs text-white/60 mb-2">
              {t('message_label')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              maxLength={1000}
              rows={3}
              placeholder={t('message_placeholder')}
              className="input-field text-sm resize-none"
            />
            <p className="text-[10px] text-white/30 mt-1 text-right">{message.length}/1000</p>
          </div>

          {/* Email — obligatoire ou optionnel selon le motif */}
          <div>
            <label className="block text-xs text-white/60 mb-2">
              {t('email_label')}
              {isEmailRequired ? (
                <span className="ml-1 text-faso-red font-medium">*</span>
              ) : (
                <span className="ml-1 text-white/30">({t('optional')})</span>
              )}
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => validateEmail(email)}
              placeholder={t('email_placeholder')}
              required={isEmailRequired}
              className={`input-field text-sm ${emailError ? 'border-faso-red/60' : ''}`}
            />

            {/* Message contextuel selon motif */}
            {isEmailRequired && !emailError && (
              <p className="text-[10px] text-amber-400/80 mt-1 flex items-start gap-1">
                <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                {t('email_legal_notice')}
              </p>
            )}
            {emailError && (
              <p className="text-[10px] text-faso-red mt-1">{emailError}</p>
            )}
            {!isEmailRequired && !emailError && (
              <p className="text-[10px] text-white/30 mt-1">{t('email_optional_notice')}</p>
            )}
          </div>

          {/* Turnstile */}
          {TURNSTILE_ENABLED && (
            <div className="flex justify-center">
              <div ref={turnstileContainerRef} />
            </div>
          )}

          {/* Erreur serveur */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-faso-red/10 border border-faso-red/20">
              <AlertCircle size={14} className="text-faso-red flex-shrink-0 mt-0.5" />
              <p className="text-faso-red text-xs">{errorMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="btn-primary flex-1 justify-center py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <><Loader2 size={14} className="animate-spin" /> {t('submitting')}</>
              ) : (
                <><Flag size={14} /> {t('submit')}</>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); reset() }}
              className="btn-ghost text-sm"
            >
              {t('cancel')}
            </button>
          </div>

          <p className="text-[10px] text-white/30 text-center">
            {t('legal_notice')}
          </p>
        </form>
      )}
    </div>
  )
}
