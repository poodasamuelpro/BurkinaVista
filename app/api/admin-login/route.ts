/**
 * app/api/admin-login/route.ts — Connexion admin par email + mot de passe
 * Compare avec ADMIN_EMAIL et ADMIN_PASSWORD du .env
 * Crée un cookie JWT httpOnly sécurisé
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL ou ADMIN_PASSWORD non définis')
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    // Comparaison sécurisée (case-insensitive pour l'email)
    const emailMatch = email.toLowerCase().trim() === adminEmail.toLowerCase().trim()
    const passwordMatch = password === adminPassword

    if (!emailMatch || !passwordMatch) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    // Créer le token JWT (expire 24h)
    const token = await createAdminToken()

    // Créer la réponse avec cookie httpOnly sécurisé
    const response = NextResponse.json({ success: true })

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 heures
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Erreur login admin:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
