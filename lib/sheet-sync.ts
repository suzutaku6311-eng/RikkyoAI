/**
 * スプレッドシートの行データの差分を検出
 */
export interface SheetRow {
  [key: string]: any;
}

export interface ChangeDetectionResult {
  added: SheetRow[];
  modified: SheetRow[];
  deleted: SheetRow[];
}

/**
 * 既存の行と新しい行を比較して差分を検出
 * 日付と議題をキーとして比較（カスタマイズ可能）
 */
export function detectChanges(
  existingRows: SheetRow[],
  newRows: SheetRow[],
  keyFields: string[] = ['date', 'topic'] // デフォルトは日付と議題
): ChangeDetectionResult {
  // キーを生成する関数
  const getKey = (row: SheetRow): string => {
    return keyFields.map(field => row[field] || '').join('_');
  };

  const existingMap = new Map(
    existingRows.map(row => [getKey(row), row])
  );
  const newMap = new Map(
    newRows.map(row => [getKey(row), row])
  );

  const added: SheetRow[] = [];
  const modified: SheetRow[] = [];
  const deleted: SheetRow[] = [];

  // 追加・変更を検出
  for (const [key, newRow] of newMap) {
    const existingRow = existingMap.get(key);
    if (!existingRow) {
      added.push(newRow);
    } else if (JSON.stringify(existingRow) !== JSON.stringify(newRow)) {
      modified.push(newRow);
    }
  }

  // 削除を検出
  for (const [key, existingRow] of existingMap) {
    if (!newMap.has(key)) {
      deleted.push(existingRow);
    }
  }

  return { added, modified, deleted };
}

/**
 * スプレッドシートの行データをオブジェクトの配列に変換
 */
export function convertRowsToObjects(rows: any[][]): SheetRow[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0] || [];
  return rows.slice(1).map(row => {
    const obj: SheetRow = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

