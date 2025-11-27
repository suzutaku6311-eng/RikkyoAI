import { google } from 'googleapis';

/**
 * Google Sheets APIクライアントを取得
 */
export async function getGoogleSheetsClient() {
  const serviceAccountEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.GOOGLE_SHEETS_PROJECT_ID;

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google Sheets認証情報が設定されていません。環境変数を確認してください。');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
      project_id: projectId,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

/**
 * スプレッドシートIDをURLから抽出
 */
export function extractSpreadsheetId(url: string): string | null {
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit の形式
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * スプレッドシートのデータを取得
 */
export async function getSheetData(
  spreadsheetId: string,
  sheetName: string,
  range?: string
): Promise<any[][]> {
  const sheets = await getGoogleSheetsClient();
  const rangeString = range || `${sheetName}!A:Z`;
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rangeString,
    });

    return response.data.values || [];
  } catch (error: any) {
    console.error('[Google Sheets] データ取得エラー:', error);
    if (error.code === 404) {
      throw new Error(`スプレッドシートが見つかりません: ${spreadsheetId}`);
    } else if (error.code === 403) {
      throw new Error(`スプレッドシートへのアクセス権限がありません: ${spreadsheetId}`);
    }
    throw error;
  }
}

/**
 * スプレッドシートのメタデータを取得
 */
export async function getSpreadsheetMetadata(spreadsheetId: string) {
  const sheets = await getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return {
      title: response.data.properties?.title || '',
      modifiedTime: response.data.properties?.modifiedTime || null,
      sheets: response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title || '',
        sheetId: sheet.properties?.sheetId || 0,
      })) || [],
    };
  } catch (error: any) {
    console.error('[Google Sheets] メタデータ取得エラー:', error);
    if (error.code === 404) {
      throw new Error(`スプレッドシートが見つかりません: ${spreadsheetId}`);
    } else if (error.code === 403) {
      throw new Error(`スプレッドシートへのアクセス権限がありません: ${spreadsheetId}`);
    }
    throw error;
  }
}

/**
 * スプレッドシートのデータをテキストに変換
 */
export function convertSheetRowsToText(rows: any[][]): string {
  if (rows.length === 0) {
    return '';
  }

  // ヘッダー行を取得
  const headers = rows[0] || [];
  
  // データ行をテキストに変換
  const textRows = rows.slice(1).map((row, index) => {
    const rowData = headers.map((header, colIndex) => {
      const value = row[colIndex] || '';
      return `${header}: ${value}`;
    }).join('\n');
    
    return `--- 議事録 ${index + 1} ---\n${rowData}\n`;
  });

  return textRows.join('\n');
}

