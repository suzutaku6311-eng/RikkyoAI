// 検索機能のテストスクリプト
// 実行方法: npm run test:search

import { config } from 'dotenv'
import { resolve } from 'path'

// .env.localファイルを読み込む（lib/supabase.tsのインポート前に実行）
const envPath = resolve(process.cwd(), '.env.local')
const result = config({ path: envPath })

if (result.error) {
  console.error('❌ .env.localファイルの読み込みに失敗:', result.error.message)
  process.exit(1)
}

import { searchSimilarChunks } from '../lib/rag'

async function testSearch() {
  const question = process.argv[2] || 'Ethos'
  console.log(`🔍 検索テスト: "${question}"\n`)

  try {
    const chunks = await searchSimilarChunks(question, 10)
    
    console.log(`\n✅ 検索結果: ${chunks.length}件のチャンクが見つかりました\n`)

    if (chunks.length > 0) {
      chunks.forEach((chunk, index) => {
        console.log(`--- チャンク ${index + 1} ---`)
        console.log(`類似度: ${chunk.similarity ? (chunk.similarity * 100).toFixed(2) + '%' : 'N/A'}`)
        console.log(`文書: ${chunk.documentTitle || '不明'}`)
        console.log(`内容: ${chunk.content.substring(0, 200)}...`)
        console.log('')
      })
    } else {
      console.log('⚠️  関連するチャンクが見つかりませんでした')
    }
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

testSearch()

