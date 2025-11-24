// Supabase接続テストスクリプト
// 実行方法: npm run test:supabase

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.localファイルを読み込む
const envPath = resolve(process.cwd(), '.env.local')
const result = config({ path: envPath })

if (result.error) {
  console.error('❌ .env.localファイルの読み込みに失敗:', result.error.message)
  process.exit(1)
}

// 環境変数の確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定')
  process.exit(1)
}

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Supabase接続テストを開始します...\n')

  try {
    // 1. 接続テスト
    console.log('1. 接続テスト...')
    const { data, error } = await supabase.from('documents').select('count').limit(0)
    
    if (error) {
      console.error('❌ 接続エラー:', error.message)
      return
    }
    
    console.log('✅ Supabaseへの接続が成功しました\n')

    // 2. documentsテーブルの確認
    console.log('2. documentsテーブルの確認...')
    const { data: docsData, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .limit(1)
    
    if (docsError) {
      console.error('❌ documentsテーブルの確認に失敗:', docsError.message)
      return
    }
    
    console.log('✅ documentsテーブルが存在します')
    console.log(`   現在のレコード数: ${docsData?.length || 0}\n`)

    // 3. chunksテーブルの確認
    console.log('3. chunksテーブルの確認...')
    const { data: chunksData, error: chunksError } = await supabase
      .from('chunks')
      .select('*')
      .limit(1)
    
    if (chunksError) {
      console.error('❌ chunksテーブルの確認に失敗:', chunksError.message)
      return
    }
    
    console.log('✅ chunksテーブルが存在します')
    console.log(`   現在のレコード数: ${chunksData?.length || 0}\n`)

    console.log('🎉 すべてのテストが成功しました！')
    console.log('\n次のステップ:')
    console.log('1. OpenAI APIキーを .env.local に設定')
    console.log('2. npm run dev で開発サーバーを起動')
    console.log('3. /api/admin/ingest でPDFアップロードをテスト')

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

testConnection()
