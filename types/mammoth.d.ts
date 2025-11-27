declare module 'mammoth' {
  export interface ExtractRawTextOptions {
    buffer: Buffer
  }

  export interface ExtractRawTextResult {
    value: string
    messages: Array<{ type: string; message: string }>
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>
}

