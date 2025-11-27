import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { getSheetData, getSpreadsheetMetadata, convertSheetRowsToText } from '@/lib/google-sheets'
import { generateEmbeddingsForChunks, splitTextIntoChunks } from '@/lib/embeddings'
import { detectChanges, convertRowsToObjects } from '@/lib/sheet-sync'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sourceId = params.id
    const supabase = getSupabaseServerClient()

    // ソース情報を取得
    const { data: source, error: sourceError } = await supabase
      .from('google_sheets_sources')
      .select('*, documents(*)')
      .eq('id', sourceId)
      .single()

    if (sourceError || !source) {
      return NextResponse.json(
        { error: 'スプレッドシートソースが見つかりません' },
        { status: 404 }
      )
    }

    if (!source.sync_enabled) {
      return NextResponse.json(
        { error: 'このスプレッドシートの同期は無効になっています' },
        { status: 400 }
      )
    }

    // メタデータを取得して変更を確認
    const metadata = await getSpreadsheetMetadata(source.spreadsheet_id)
    const currentModifiedTime = metadata.modifiedTime ? new Date(metadata.modifiedTime) : null
    const lastSyncedTime = source.last_sheet_modified_at ? new Date(source.last_sheet_modified_at) : null

    // 変更がない場合はスキップ
    if (currentModifiedTime && lastSyncedTime && currentModifiedTime <= lastSyncedTime) {
      return NextResponse.json({
        success: true,
        message: '変更はありません',
        skipped: true,
      })
    }

    // データを取得
    const rows = await getSheetData(source.spreadsheet_id, source.sheet_name)
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'スプレッドシートにデータがありません' },
        { status: 400 }
      )
    }

    // テキストに変換
    const text = convertSheetRowsToText(rows)
    
    // チャンク分割
    const chunks = splitTextIntoChunks(text)
    
    // Embedding生成
    console.log(`[Google Sheets] ${chunks.length}個のチャンクに対してEmbedding生成を開始`)
    const embeddings = await generateEmbeddingsForChunks(chunks)
    
    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding生成に失敗しました。期待: ${chunks.length}, 実際: ${embeddings.length}`)
    }

    // 既存のチャンクを削除
    const { error: deleteError } = await supabase
      .from('chunks')
      .delete()
      .eq('document_id', source.document_id)

    if (deleteError) {
      console.error('[Google Sheets] 既存チャンク削除エラー:', deleteError)
      throw new Error(`既存チャンクの削除に失敗しました: ${deleteError.message}`)
    }

    // 新しいチャンクを保存
    const chunksToInsert = chunks.map((chunk, index) => ({
      document_id: source.document_id,
      content: chunk,
      chunk_index: index,
      embedding: embeddings[index],
    }))

    const { error: chunksError } = await supabase
      .from('chunks')
      .insert(chunksToInsert)

    if (chunksError) {
      console.error('[Google Sheets] チャンク保存エラー:', chunksError)
      throw new Error(`チャンクの保存に失敗しました: ${chunksError.message}`)
    }

    // 最終同期時刻を更新
    const { error: updateError } = await supabase
      .from('google_sheets_sources')
      .update({
        last_synced_at: new Date().toISOString(),
        last_sheet_modified_at: metadata.modifiedTime || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId)

    if (updateError) {
      console.error('[Google Sheets] 更新エラー:', updateError)
      throw new Error(`同期時刻の更新に失敗しました: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: '同期が完了しました',
      data: {
        chunks_count: chunks.length,
        last_synced_at: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[Google Sheets] 同期エラー:', error)
    return NextResponse.json(
      { error: error.message || '同期に失敗しました' },
      { status: 500 }
    )
  }
}

