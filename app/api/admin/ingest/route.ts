import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'
import { checkOpenAIEnv } from '@/lib/openai'
import { splitIntoChunks, generateEmbeddingsForChunks } from '@/lib/embeddings'

// pdf-parseはNode.jsのBufferを使うため、Node.js Runtimeを指定
export const runtime = 'nodejs'

// Vercelのタイムアウト設定（最大60秒）
export const maxDuration = 60

/**
 * 文書ファイル（PDF/DOCX/TXT）のingest処理
 * 1. ファイルからテキスト抽出
 * 2. チャンク分割（300-500文字）
 * 3. Embedding生成
 * 4. Supabaseに保存
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[Ingest] 処理開始')
  
  try {
    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      console.error('[Ingest] Supabase環境変数エラー:', supabaseCheck.error)
      return NextResponse.json(
        { success: false, error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    // supabaseがnullでないことを確認（TypeScript用）
    const supabaseClient = supabase

    const openaiCheck = checkOpenAIEnv()
    if (!openaiCheck.isValid) {
      console.error('[Ingest] OpenAI環境変数エラー:', openaiCheck.error)
      return NextResponse.json(
        { success: false, error: openaiCheck.error },
        { status: 500 }
      )
    }

    // FormDataからファイルを取得
    console.log('[Ingest] FormDataを取得中...')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file) {
      console.error('[Ingest] ファイルが指定されていません')
      return NextResponse.json(
        { success: false, error: 'ファイルが指定されていません' },
        { status: 400 }
      )
    }

    console.log(`[Ingest] ファイル情報: ${file.name}, サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`)

    // ファイルサイズの制限（Vercel無料プランの制限: 4.5MB）
    const maxSize = 4.5 * 1024 * 1024 // 4.5MB
    if (file.size > maxSize) {
      console.error(`[Ingest] ファイルサイズが大きすぎます: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return NextResponse.json(
        { success: false, error: `ファイルサイズが大きすぎます。Vercel無料プランの制限により、最大4.5MBまで対応しています。現在のサイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      )
    }

    // ファイルタイプの判定
    const fileName = file.name.toLowerCase()
    const fileType = file.type
    let fileTypeDetected: 'pdf' | 'docx' | 'txt' | 'xlsx' | 'xls' | null = null
    
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      fileTypeDetected = 'pdf'
    } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileTypeDetected = 'docx'
    } else if (fileName.endsWith('.txt') || fileType === 'text/plain') {
      fileTypeDetected = 'txt'
    } else if (fileName.endsWith('.xlsx') || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      fileTypeDetected = 'xlsx'
    } else if (fileName.endsWith('.xls') || fileType === 'application/vnd.ms-excel') {
      fileTypeDetected = 'xls'
    }
    
    if (!fileTypeDetected) {
      console.error('[Ingest] サポートされていないファイル形式です')
      return NextResponse.json(
        { success: false, error: 'PDF、DOCX、TXT、Excel（XLSX/XLS）ファイルのみ対応しています' },
        { status: 400 }
      )
    }

    console.log(`[Ingest] ファイルタイプ: ${fileTypeDetected}`)
    
    // ファイルからテキスト抽出
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let extractedText = ''
    
    if (fileTypeDetected === 'pdf') {
      console.log('[Ingest] PDFからテキスト抽出中...')
    const pdfData = await pdfParse(buffer, {
      max: 0, // 全ページを処理
    })
      extractedText = pdfData.text
    
    // 文字化けの修正処理
    extractedText = extractedText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    } else if (fileTypeDetected === 'docx') {
      console.log('[Ingest] DOCXからテキスト抽出中...')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
      
      // テキストの正規化
      extractedText = extractedText
        .replace(/\s+/g, ' ')
        .trim()
    } else if (fileTypeDetected === 'txt') {
      console.log('[Ingest] TXTからテキスト抽出中...')
      // UTF-8として読み込み
      extractedText = buffer.toString('utf-8')
      
      // テキストの正規化
      extractedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\s+/g, ' ')
        .trim()
    } else if (fileTypeDetected === 'xlsx' || fileTypeDetected === 'xls') {
      console.log(`[Ingest] Excel (${fileTypeDetected.toUpperCase()})からテキスト抽出中...`)
      
      // Excelファイルを読み込む
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      
      // すべてのシートからテキストを抽出
      const sheetTexts: string[] = []
      
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName]
        
        // シートをJSON形式に変換（すべてのセルを取得）
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, // 配列形式で取得
          defval: '', // 空のセルは空文字列として扱う
          raw: false // 数値も文字列として取得
        }) as any[][]
        
        // シート名を追加
        sheetTexts.push(`[シート: ${sheetName}]`)
        
        // 各行を処理
        sheetData.forEach((row, rowIndex) => {
          if (row && row.length > 0) {
            // 行の各セルの値を結合（空でない値のみ）
            const rowValues = row
              .filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
              .map(cell => String(cell).trim())
            
            if (rowValues.length > 0) {
              sheetTexts.push(rowValues.join(' | '))
            }
          }
        })
        
        // シート間に空行を追加
        if (index < workbook.SheetNames.length - 1) {
          sheetTexts.push('')
        }
      })
      
      extractedText = sheetTexts.join('\n')
      
      // テキストの正規化
      extractedText = extractedText
      .replace(/\s+/g, ' ')
      .trim()
      
      console.log(`[Ingest] Excelから ${workbook.SheetNames.length}個のシートを処理しました`)
    }
    
    console.log(`[Ingest] テキスト抽出完了: ${extractedText.length}文字`)
    console.log(`[Ingest] テキストサンプル（最初の200文字）: ${extractedText.substring(0, 200)}`)

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('[Ingest] PDFからテキストを抽出できませんでした')
      return NextResponse.json(
        { success: false, error: 'PDFからテキストを抽出できませんでした' },
        { status: 400 }
      )
    }

    // チャンク分割
    console.log('[Ingest] チャンク分割中...')
    const chunks = splitIntoChunks(extractedText)
    console.log(`[Ingest] チャンク分割完了: ${chunks.length}個のチャンク`)
    
    if (chunks.length === 0) {
      console.error('[Ingest] チャンク分割に失敗しました')
      return NextResponse.json(
        { success: false, error: 'チャンク分割に失敗しました' },
        { status: 500 }
      )
    }

    // Embedding生成（一括処理）
    console.log(`[Ingest] Embedding生成開始: ${chunks.length}個のチャンク`)
    const embeddingStartTime = Date.now()
    
    let embeddings: number[][]
    try {
      embeddings = await generateEmbeddingsForChunks(chunks)
    const embeddingTime = Date.now() - embeddingStartTime
    console.log(`[Ingest] Embedding生成完了: ${embeddingTime}ms`)
    } catch (error: any) {
      const embeddingTime = Date.now() - embeddingStartTime
      console.error(`[Ingest] Embedding生成エラー (${embeddingTime}ms):`, error)
      const errorMessage = error?.message || 'Embedding生成に失敗しました'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }

    if (embeddings.length !== chunks.length) {
      console.error(`[Ingest] Embedding生成に失敗: ${embeddings.length}個 / ${chunks.length}個`)
      return NextResponse.json(
        { success: false, error: `Embedding生成に失敗しました: ${embeddings.length}個 / ${chunks.length}個` },
        { status: 500 }
      )
    }

    // 文書情報をSupabaseに保存
    console.log('[Ingest] 文書情報をSupabaseに保存中...')
    const documentTitle = title || file.name.replace(/\.(pdf|docx|txt|xlsx|xls)$/i, '')
    const { data: documentData, error: documentError } = await supabaseClient
      .from('documents')
      .insert({
        title: documentTitle,
        file_name: file.name,
        file_type: fileTypeDetected === 'xls' ? 'xlsx' : fileTypeDetected, // xlsもxlsxとして保存
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (documentError || !documentData) {
      console.error('[Ingest] 文書保存エラー:', documentError)
      return NextResponse.json(
        { success: false, error: `文書の保存に失敗しました: ${documentError?.message || '不明なエラー'}` },
        { status: 500 }
      )
    }

    const documentId = documentData.id
    console.log(`[Ingest] 文書保存完了: ID=${documentId}`)

    // ファイルをSupabase Storageに保存
    console.log(`[Ingest] ${fileTypeDetected.toUpperCase()}ファイルをSupabase Storageに保存中...`)
    const filePath = `documents/${documentId}/${file.name}`
    
    // ファイルタイプに応じたContent-Typeを設定
    let contentType = 'application/pdf'
    if (fileTypeDetected === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (fileTypeDetected === 'txt') {
      contentType = 'text/plain'
    } else if (fileTypeDetected === 'xlsx' || fileTypeDetected === 'xls') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    const { error: storageError } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: contentType,
        upsert: false,
      })

    if (storageError) {
      console.error('[Ingest] Storage保存エラー:', storageError)
      // Storage保存に失敗した場合でも処理を続行（既存の文書は削除しない）
      // ただし、後でPDF閲覧ができない可能性がある
    } else {
      console.log(`[Ingest] Storage保存完了: ${filePath}`)
      
      // documentsテーブルにfile_pathを更新
      const { error: updateError } = await supabaseClient
        .from('documents')
        .update({ file_path: filePath })
        .eq('id', documentId)

      if (updateError) {
        console.warn('[Ingest] file_path更新エラー:', updateError)
      }
    }

    // チャンクとEmbeddingをSupabaseに保存
    console.log('[Ingest] チャンクとEmbeddingをSupabaseに保存中...')
    const chunksToInsert = chunks.map((content, index) => ({
      document_id: documentId,
      content: content,
      embedding: embeddings[index],
      chunk_index: index,
      metadata: {},
    }))

    // バッチで挿入（Supabaseの制限に合わせて分割）
    const batchSize = 100
    let savedCount = 0
    for (let i = 0; i < chunksToInsert.length; i += batchSize) {
      const batch = chunksToInsert.slice(i, i + batchSize)
      const { error: chunksError } = await supabaseClient
        .from('chunks')
        .insert(batch)

      if (chunksError) {
        console.error('[Ingest] チャンク保存エラー:', chunksError)
        // エラーが発生した場合、既に保存された文書を削除
        await supabaseClient.from('documents').delete().eq('id', documentId)
        return NextResponse.json(
          { success: false, error: `チャンクの保存に失敗しました: ${chunksError.message}` },
          { status: 500 }
        )
      }
      savedCount += batch.length
      console.log(`[Ingest] チャンク保存進捗: ${savedCount}/${chunks.length}`)
    }

    const totalTime = Date.now() - startTime
    console.log(`[Ingest] 処理完了: ${totalTime}ms, チャンク数: ${chunks.length}`)

    return NextResponse.json({
      success: true,
      documentId: documentId,
      chunksCount: chunks.length,
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[Ingest] 処理エラー (${totalTime}ms):`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? `${error.message} (処理時間: ${totalTime}ms)` : `予期しないエラーが発生しました (処理時間: ${totalTime}ms)`,
      },
      { status: 500 }
    )
  }
}
