/**
 * 复制本文件为 config.ts 并填写 Key：
 *   copy config.example.ts config.ts   (Windows PowerShell)
 */
const DEEPSEEK_SHARED = {
  apiKey: 'sk-c4d7cf6068cc4908a077bab3614a9350',
  baseUrl: 'https://api.deepseek.com',
} as const

const DOUBAO_SHARED = {
  apiKey: 'ark-ef997cce-38de-4233-b010-62254222f968-aa618',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
} as const

export const CONFIG = {
  'deepseek-v4-flash': {
    ...DEEPSEEK_SHARED,
    model: 'deepseek-v4-flash',
  },
  'deepseek-v4-pro': {
    ...DEEPSEEK_SHARED,
    model: 'deepseek-v4-pro',
  },
  doubao: {
    ...DOUBAO_SHARED,
    model: 'YOUR_LITE_ENDPOINT_ID',
  },
  'doubao-seed-2-pro': {
    ...DOUBAO_SHARED,
    model: 'YOUR_PRO_ENDPOINT_ID',
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

export type Provider =
  | 'deepseek-v4-flash'
  | 'deepseek-v4-pro'
  | 'doubao'
  | 'doubao-seed-2-pro'

export interface ProviderMeta {
  id: Provider
  shortLabel: string
  fullName: string
  modelId: string
  vendor: string
}

export const PROVIDER_META: ProviderMeta[] = [
  {
    id: 'deepseek-v4-flash',
    shortLabel: 'DeepSeek',
    fullName: 'DeepSeek V4 Flash',
    modelId: 'deepseek-v4-flash',
    vendor: '深度求索 DeepSeek',
  },
  {
    id: 'deepseek-v4-pro',
    shortLabel: 'DeepSeek',
    fullName: 'DeepSeek V4 Pro',
    modelId: 'deepseek-v4-pro',
    vendor: '深度求索 DeepSeek',
  },
  {
    id: 'doubao',
    shortLabel: '豆包',
    fullName: 'Doubao-Seed-2.0-lite',
    modelId: 'YOUR_LITE_ENDPOINT_ID',
    vendor: '字节跳动 · 火山方舟',
  },
  {
    id: 'doubao-seed-2-pro',
    shortLabel: '豆包',
    fullName: 'Doubao-Seed-2.0-pro',
    modelId: 'YOUR_PRO_ENDPOINT_ID',
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
