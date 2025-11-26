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
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // file_pathが存在しない場合は古い文書の可能性がある
    if (!document.file_path) {
      // 古い形式のパスを試す
      const oldPath = `documents/${documentId}/${document.file_name}`
      const { data: oldFile, error: oldError } = await supabaseClient.storage
        .from('documents')
        .download(oldPath)

      if (!oldError && oldFile) {
        const arrayBuffer = await oldFile.arrayBuffer()
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${document.file_name}"`,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }

      return NextResponse.json(
        { error: 'PDF file not found in storage' },
        { status: 404 }
      )
    }

    // StorageからPDFファイルを取得
    const { data: fileData, error: storageError } = await supabaseClient.storage
      .from('documents')
      .download(document.file_path)

    if (storageError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to retrieve PDF file' },
        { status: 500 }
      )
    }

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

