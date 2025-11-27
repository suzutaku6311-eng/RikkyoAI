import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

/**
 * すべての有効なスプレッドシートを同期
 * Cron Jobから呼び出される
 */
export async function POST(request: NextRequest) {
  try {
    // 認証トークンの確認（Cron実行時）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseServerClient()

    // 同期が有効なソースを取得
    const { data: sources, error: sourcesError } = await supabase
      .from('google_sheets_sources')
      .select('*')
      .eq('sync_enabled', true)

    if (sourcesError) {
      console.error('[Sync Sheets] ソース取得エラー:', sourcesError)
      return NextResponse.json(
        { error: 'ソースの取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({
        success: true,
        message: '同期対象のスプレッドシートがありません',
        synced_count: 0,
      })
    }

    const results = []
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

    // 各ソースを順次同期
    for (const source of sources) {
      try {
        // 同期間隔をチェック
        if (source.last_synced_at) {
          const lastSynced = new Date(source.last_synced_at)
          const now = new Date()
          const minutesSinceLastSync = (now.getTime() - lastSynced.getTime()) / (1000 * 60)
          
          if (minutesSinceLastSync < source.sync_interval_minutes) {
            console.log(`[Sync Sheets] ${source.id} はまだ同期間隔に達していません（${Math.floor(minutesSinceLastSync)}分経過）`)
            results.push({
              source_id: source.id,
              status: 'skipped',
              reason: 'sync_interval_not_reached',
            })
            continue
          }
        }

        // 個別同期APIを呼び出し
        const syncUrl = `${baseUrl}/api/admin/google-sheets/${source.id}/sync`
        const response = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()
        
        if (response.ok) {
          results.push({
            source_id: source.id,
            status: 'success',
            ...result,
          })
        } else {
          results.push({
            source_id: source.id,
            status: 'error',
            error: result.error,
          })
        }
      } catch (error: any) {
        console.error(`[Sync Sheets] ${source.id} の同期エラー:`, error)
        results.push({
          source_id: source.id,
          status: 'error',
          error: error.message,
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const skippedCount = results.filter(r => r.status === 'skipped').length

    return NextResponse.json({
      success: true,
      message: `同期完了: 成功 ${successCount}件, エラー ${errorCount}件, スキップ ${skippedCount}件`,
      results,
      summary: {
        total: sources.length,
        success: successCount,
        error: errorCount,
        skipped: skippedCount,
      },
    })
  } catch (error: any) {
    console.error('[Sync Sheets] 同期エラー:', error)
    return NextResponse.json(
      { error: error.message || '同期に失敗しました' },
      { status: 500 }
    )
  }
}

