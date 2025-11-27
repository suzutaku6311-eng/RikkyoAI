/**
 * エラーハンドリングの統一
 * すべてのAPIエンドポイントで使用するエラークラスとヘルパー関数
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = '内部サーバーエラーが発生しました') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
    this.name = 'InternalServerError'
  }
}

/**
 * エラーレスポンスの形式を統一
 */
export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    }
  }

  return {
    error: '予期しないエラーが発生しました',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  }
}

/**
 * エラーログを記録（将来的にSentry等に送信可能）
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = createErrorResponse(error)
  console.error('[Error]', {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
  })
  
  // 将来的にSentry等のエラートラッキングサービスに送信
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context })
  // }
}

