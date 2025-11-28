import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { extractSpreadsheetId, getSpreadsheetMetadata, getSheetData, convertSheetRowsToText } from '@/lib/google-sheets'
import { generateEmbeddingsForChunks, splitIntoChunks } from '@/lib/embeddings'
import { convertRowsToObjects } from '@/lib/sheet-sync'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spreadsheet_url, sheet_name, title, sync_interval_minutes = 60 } = body

    if (!spreadsheet_url || !sheet_name) {
      return NextResponse.json(
        { error: 'spreadsheet_url と sheet_name は必須です' },
        { status: 400 }
      )
    }

    // Spreadsheet IDを抽出
    const spreadsheetId = extractSpreadsheetId(spreadsheet_url)
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: '無効なスプレッドシートURLです' },
        { status: 400 }
      )
    }

    // Google Sheets APIでアクセス確認とメタデータ取得
    const metadata = await getSpreadsheetMetadata(spreadsheetId)
    
    // シート名の存在確認
    const sheetExists = metadata.sheets.some(sheet => sheet.title === sheet_name)
    if (!sheetExists) {
      return NextResponse.json(
        { error: `シート "${sheet_name}" が見つかりません。利用可能なシート: ${metadata.sheets.map(s => s.title).join(', ')}` },
        { status: 400 }
      )
    }

    // データを取得
    const rows = await getSheetData(spreadsheetId, sheet_name)
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'スプレッドシートにデータがありません' },
        { status: 400 }
      )
    }

    // テキストに変換
    const text = convertSheetRowsToText(rows)
    
    // チャンク分割
    const chunks = splitIntoChunks(text)
    
    // Embedding生成
    console.log(`[Google Sheets] ${chunks.length}個のチャンクに対してEmbedding生成を開始`)
    const embeddings = await generateEmbeddingsForChunks(chunks)
    
    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding生成に失敗しました。期待: ${chunks.length}, 実際: ${embeddings.length}`)
    }

    const supabase = getSupabaseServerClient()

    // documentsテーブルに保存
    const documentTitle = title || metadata.title || `Google Sheets: ${sheet_name}`
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title: documentTitle,
        file_name: `${spreadsheetId}_${sheet_name}`,
        file_type: 'google_sheets',
        source_type: 'google_sheets',
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (docError || !document) {
      console.error('[Google Sheets] ドキュメント保存エラー:', docError)
      throw new Error(`ドキュメントの保存に失敗しました: ${docError?.message}`)
    }

    // chunksテーブルに保存
    const chunksToInsert = chunks.map((chunk, index) => ({
      document_id: document.id,
      content: chunk,
      chunk_index: index,
      embedding: embeddings[index],
    }))

    const { error: chunksError } = await supabase
      .from('chunks')
      .insert(chunksToInsert)

    if (chunksError) {
      console.error('[Google Sheets] チャンク保存エラー:', chunksError)
      // ドキュメントを削除（ロールバック）
      await supabase.from('documents').delete().eq('id', document.id)
      throw new Error(`チャンクの保存に失敗しました: ${chunksError.message}`)
    }

    // google_sheets_sourcesテーブルに保存
    const { data: source, error: sourceError } = await supabase
      .from('google_sheets_sources')
      .insert({
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: spreadsheet_url,
        sheet_name: sheet_name,
        document_id: document.id,
        last_synced_at: new Date().toISOString(),
        last_sheet_modified_at: metadata.modifiedTime || new Date().toISOString(),
        sync_enabled: true,
        sync_interval_minutes: sync_interval_minutes,
      })
      .select()
      .single()

    if (sourceError || !source) {
      console.error('[Google Sheets] ソース保存エラー:', sourceError)
      throw new Error(`ソースの保存に失敗しました: ${sourceError?.message}`)
    }

    // documentテーブルにgoogle_sheet_source_idを更新
    await supabase
      .from('documents')
      .update({ google_sheet_source_id: source.id })
      .eq('id', document.id)

    return NextResponse.json({
      success: true,
      message: 'スプレッドシートの登録が完了しました',
      data: {
        source: {
          id: source.id,
          spreadsheet_url: spreadsheet_url,
          sheet_name: sheet_name,
          document_id: document.id,
          chunks_count: chunks.length,
        },
      },
    })
  } catch (error: any) {
    console.error('[Google Sheets] 登録エラー:', error)
    return NextResponse.json(
      { error: error.message || 'スプレッドシートの登録に失敗しました' },
      { status: 500 }
    )
  }
}

