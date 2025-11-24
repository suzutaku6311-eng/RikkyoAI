import OpenAI from 'openai'

// 環境変数の存在チェック
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error(
    'Missing OPENAI_API_KEY environment variable. Please check .env.local file.'
  )
}

// OpenAIクライアントの作成
export const openai = new OpenAI({
  apiKey: apiKey,
})

