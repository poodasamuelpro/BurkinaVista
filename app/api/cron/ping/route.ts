import { queryOne } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await queryOne('SELECT 1')
    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}