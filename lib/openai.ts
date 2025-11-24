import OpenAI from 'openai'

// 環境変数の取得
const apiKey = process.env.OPENAI_API_KEY

// OpenAIクライアントの作成（環境変数が存在する場合のみ）
export const openai = apiKey
  ? new OpenAI({
      apiKey: apiKey,
    })
  : null

// 環境変数チェック用のヘルパー関数
export function checkOpenAIEnv(): { isValid: boolean; error?: string } {
  if (!apiKey) {
    return {
      isValid: false,
      error: 'Missing OPENAI_API_KEY environment variable. Please set OPENAI_API_KEY in Vercel environment variables.',
    }
  }
  return { isValid: true }
}

