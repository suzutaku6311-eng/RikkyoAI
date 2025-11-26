import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PDFファイルの閲覧用API
 * Supabase StorageからPDFファイルを取得して返す
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      return NextResponse.json(
        { error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    const supabaseClient = supabase

    // 文書情報を取得
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      console.error('[PDF View API] 文書取得エラー:', docError)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    console.log('[PDF View API] 文書情報:', { file_path: document.file_path, file_name: document.file_name })

    // 試すパスのリスト（file_pathがある場合とない場合の両方）
    const pathsToTry = []
    
    if (document.file_path) {
      pathsToTry.push(document.file_path)
    }
    
    // 古い形式のパスも試す
    pathsToTry.push(`documents/${documentId}/${document.file_name}`)
    
    // ファイル名のみも試す（念のため）
    pathsToTry.push(document.file_name)

    // 各パスを順番に試す
    for (const path of pathsToTry) {
      console.log(`[PDF View API] パスを試行中: ${path}`)
      
      const { data: fileData, error: storageError } = await supabaseClient.storage
        .from('documents')
        .download(path)

      if (!storageError && fileData) {
        console.log(`[PDF View API] ファイル取得成功: ${path}`)
        const arrayBuffer = await fileData.arrayBuffer()
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${document.file_name}"`,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      } else {
        console.log(`[PDF View API] パス ${path} でエラー:`, storageError?.message)
      }
    }

    // すべてのパスで失敗した場合
    console.error('[PDF View API] すべてのパスでファイルが見つかりませんでした')
    return NextResponse.json(
      { 
        error: 'PDF file not found in storage',
        details: `Tried paths: ${pathsToTry.join(', ')}`,
        documentId: documentId,
        fileName: document.file_name
      },
      { status: 404 }
    )

    const arrayBuffer = await fileData.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.file_name}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[PDF View API] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

