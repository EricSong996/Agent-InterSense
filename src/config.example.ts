/**
 * 复制本文件为 config.ts 并填写 Key：
 *   copy config.example.ts config.ts   (Windows PowerShell)
 */
export const CONFIG = {
  deepseek: {
    apiKey: 'YOUR_DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  doubao: {
    apiKey: 'YOUR_DOUBAO_API_KEY',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'YOUR_ENDPOINT_ID',
  },
  bocha: {
    apiKey: 'YOUR_BOCHA_API_KEY',
    baseUrl: 'https://api.bochaai.com/v1/web-search',
    count: 8,
    freshness: 'oneMonth' as
      | 'oneDay'
      | 'oneWeek'
      | 'oneMonth'
      | 'oneYear'
      | 'noLimit',
  },
} as const

export type Provider = 'deepseek' | 'doubao'

export interface ProviderMeta {
  id: Provider
  shortLabel: string
  fullName: string
  modelId: string
  vendor: string
}

export const PROVIDER_META: ProviderMeta[] = [
  {
    id: 'deepseek',
    shortLabel: 'DeepSeek',
    fullName: 'DeepSeek Chat',
    modelId: 'deepseek-chat',
    vendor: '深度求索 DeepSeek',
  },
  {
    id: 'doubao',
    shortLabel: '豆包',
    fullName: 'Doubao-Seed-2.0-lite',
    modelId: 'YOUR_ENDPOINT_ID',
    vendor: '字节跳动 · 火山方舟',
  },
]

export function getProviderMeta(id: Provider): ProviderMeta {
  return PROVIDER_META.find((p) => p.id === id) ?? PROVIDER_META[0]
}

export const PROVIDERS = PROVIDER_META.map((p) => ({
  id: p.id,
  label: p.shortLabel,
}))
