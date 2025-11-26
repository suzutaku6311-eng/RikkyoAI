import { NextResponse } from 'next/server'
import { checkSupabaseEnv } from '@/lib/supabase'
import { checkOpenAIEnv } from '@/lib/openai'

export const runtime = 'nodejs'

/**
 * ヘルスチェックAPI
 * 環境変数が正しく設定されているか確認する
 */
export async function GET() {
  const checks = {
    supabase: checkSupabaseEnv(),
    openai: checkOpenAIEnv(),
  }

  const allValid = checks.supabase.isValid && checks.openai.isValid

  return NextResponse.json({
    status: allValid ? 'ok' : 'error',
    checks: {
      supabase: {
        valid: checks.supabase.isValid,
        error: checks.supabase.error || null,
      },
      openai: {
        valid: checks.openai.isValid,
        error: checks.openai.error || null,
      },
    },
  }, {
    status: allValid ? 200 : 500,
  })
}











