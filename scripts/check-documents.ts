// アップロードされた文書を確認するスクリプト
// 実行方法: npm run check:documents

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDocuments() {
  console.log('📚 アップロードされた文書を確認します...\n')

  try {
    // 文書一覧を取得
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (docsError) {
      console.error('❌ 文書の取得に失敗:', docsError.message)
      return
    }

    if (!documents || documents.length === 0) {
      console.log('⚠️  アップロードされた文書がありません')
      return
    }

    console.log(`✅ ${documents.length}件の文書が見つかりました\n`)

    for (const doc of documents) {
      console.log(`📄 ${doc.title}`)
      console.log(`   ID: ${doc.id}`)
      console.log(`   ファイル名: ${doc.file_name}`)
      console.log(`   ファイルタイプ: ${doc.file_type}`)
      console.log(`   アップロード日時: ${new Date(doc.uploaded_at).toLocaleString('ja-JP')}`)

      // チャンク数を取得
      const { count, error: chunksError } = await supabase
        .from('chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', doc.id)

      if (chunksError) {
        console.log(`   ⚠️  チャンク数の取得に失敗: ${chunksError.message}`)
      } else {
        console.log(`   チャンク数: ${count || 0}`)
      }

      console.log('')
    }

    // 全体のチャンク数を取得
    const { count: totalChunks, error: totalChunksError } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true })

    if (!totalChunksError) {
      console.log(`📊 合計チャンク数: ${totalChunks || 0}`)
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

checkDocuments()













