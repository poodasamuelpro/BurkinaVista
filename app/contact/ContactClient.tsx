'use client'
/**
 * app/contact/ContactClient.tsx — Formulaire de contact interactif
 */
import { useState } from 'react'
import { Mail, Send, Loader2, CheckCircle, AlertCircle, MessageSquare, Clock, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

type ContactType = 'complaint' | 'recommendation' | 'advice' | 'dispute' | 'report' | 'question' | 'other'

export default function ContactClient() {
  const t = useTranslations('contact')

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    subject: '',
    type: '' as ContactType | '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstname || !form.lastname || !form.email || !form.subject || !form.message) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error || t('error') + ' BurkinaVista@gmail.com')
      }
    } catch {
      setStatus('error')
      setErrorMsg(t('error') + ' BurkinaVista@gmail.com')
    }
  }

  const contactTypes: { value: ContactType; label: string }[] = [
    { value: 'complaint', label: t('type_complaint') },
    { value: 'recommendation', label: t('type_recommendation') },
    { value: 'advice', label: t('type_advice') },
    { value: 'dispute', label: t('type_dispute') },
    { value: 'report', label: t('type_report') },
    { value: 'question', label: t('type_question') },
    { value: 'other', label: t('type_other') },
  ]

  const infoCards = [
    {
      icon: Mail,
      color: 'text-faso-gold',
      bg: 'bg-faso-gold/10',
      label: t('email_label'),
      value: 'BurkinaVista@gmail.com',
      href: 'mailto:BurkinaVista@gmail.com',
      desc: t('email_desc'),
    },
    {
      icon: Clock,
      color: 'text-faso-green',
      bg: 'bg-faso-green/10',
      label: t('response_label'),
      value: t('response_time'),
      href: null,
      desc: null,
    },
    {
      icon: Globe,
      color: 'text-faso-red',
      bg: 'bg-faso-red/10',
      label: t('lang_label'),
      value: t('lang_value'),
      href: null,
      desc: null,
    },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 badge badge-gold mb-6 animate-pulse-gold">
            <MessageSquare size={14} />
            {t('badge')}
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight animate-fade-in">
            {t('title')}{' '}
            <span className="text-gradient-faso">{t('title_gradient')}</span>
          </h1>
          <div className="faso-divider w-32 mx-auto mb-8" />
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed animate-fade-in animate-delay-200">
            {t('subtitle')}
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {infoCards.map(({ icon: Icon, color, bg, label, value, href, desc }, i) => (
            <div
              key={label}
              className={`card p-6 text-center animate-fade-in-up animate-delay-${(i + 1) * 100}`}
            >
              <div className={`contact-card-icon ${bg} mx-auto`}>
                <Icon size={22} className={color} />
              </div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{label}</p>
              {href ? (
                <a
                  href={href}
                  className="font-medium text-faso-gold hover:text-faso-gold/80 transition-colors text-sm break-all"
                >
                  {value}
                </a>
              ) : (
                <p className="font-medium text-white text-sm">{value}</p>
              )}
              {desc && <p className="text-white/30 text-xs mt-1">{desc}</p>}
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div className="card p-8 md:p-10 border border-faso-gold/10 animate-fade-in-up animate-delay-300">
          <h2 className="font-display text-2xl text-white mb-8 flex items-center gap-3">
            <Send size={20} className="text-faso-gold" />
            {t('form_title')}
          </h2>

          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-faso-green/15 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                <CheckCircle size={40} className="text-faso-green" />
              </div>
              <h3 className="font-display text-2xl text-white mb-3">{t('success_title')}</h3>
              <p className="text-white/50 mb-2">{t('success_desc')}</p>
              <a
                href="mailto:BurkinaVista@gmail.com"
                className="text-faso-gold hover:underline font-medium"
              >
                BurkinaVista@gmail.com
              </a>
              <div className="mt-8">
                <Link href="/" className="btn-gold">
                  ← Retour
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ligne prénom + nom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    {t('field_firstname')} <span className="text-faso-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    value={form.firstname}
                    onChange={handleChange}
                    placeholder={t('firstname_placeholder')}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    {t('field_lastname')} <span className="text-faso-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    value={form.lastname}
                    onChange={handleChange}
                    placeholder={t('lastname_placeholder')}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  {t('field_email')} <span className="text-faso-red">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t('email_placeholder')}
                    className="input-field pl-11"
                    required
                  />
                </div>
              </div>

              {/* Type + Sujet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    {t('field_type')}
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="input-field appearance-none"
                  >
                    <option value="">—</option>
                    {contactTypes.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    {t('field_subject')} <span className="text-faso-red">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder={t('subject_placeholder')}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  {t('field_message')} <span className="text-faso-red">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t('field_message_placeholder')}
                  rows={6}
                  className="input-field resize-none"
                  required
                />
              </div>

              {/* Erreur */}
              {status === 'error' && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-faso-red/10 border border-faso-red/20">
                  <AlertCircle size={16} className="text-faso-red flex-shrink-0 mt-0.5" />
                  <p className="text-faso-red text-sm">{errorMsg}</p>
                </div>
              )}

              <p className="text-white/30 text-xs">{t('required_fields')}</p>

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={
                  status === 'loading' ||
                  !form.firstname || !form.lastname || !form.email ||
                  !form.subject || !form.message
                }
                className="w-full btn-primary justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {t('submit')}
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Direct email fallback */}
        <div className="text-center mt-12">
          <p className="text-white/30 text-sm mb-3">
            {/* Ou directement par email */}
          </p>
          <a
            href="mailto:BurkinaVista@gmail.com"
            className="inline-flex items-center gap-2 text-faso-gold hover:text-faso-gold/80 transition-colors font-medium"
          >
            <Mail size={18} />
            BurkinaVista@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
