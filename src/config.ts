/**
 * 在此填写 API Key（仅本地/私有仓库使用；公开仓库请勿提交真实 Key）
 * 豆包 model 填火山方舟控制台创建的「推理接入点 ID」
 */
const DEEPSEEK_SHARED = {
  apiKey: 'ark-ef997cce-38de-4233-b010-62254222f968-aa618',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
} as const

const DOUBAO_SHARED = {
  apiKey: 'ark-ef997cce-38de-4233-b010-62254222f968-aa618',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
} as const

export const CONFIG = {
  'deepseek-v4-flash': {
    ...DEEPSEEK_SHARED,
    model: 'ep-20260529231454-52v6k',
  },
  'deepseek-v4-pro': {
    ...DEEPSEEK_SHARED,
    model: 'ep-20260529233017-hdt4q',
  },
  doubao: {
    ...DOUBAO_SHARED,
    model: 'ep-20260520210121-c6jmk',
  },
  'doubao-seed-2-pro': {
    ...DOUBAO_SHARED,
    model: 'ep-20260521203639-qbvlc',
  },
  /** 博查联网搜索 https://open.bochaai.com */
  bocha: {
    apiKey: 'sk-707cf5e368c4495fb96317198af53439',
    baseUrl: 'https://api.bochaai.com/v1/web-search',
    count: 8,
    /**
     * 时间范围：oneDay | oneWeek | oneMonth | oneYear | noLimit
     * 要偏新资讯用 oneWeek / oneMonth；noLimit 容易排到去年 SEO 老文
     */
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
  /** 下拉按钮上显示的简称 */
  shortLabel: string
  /** 完整展示名 */
  fullName: string
  /** API 模型 / 接入点标识 */
  modelId: string
  vendor: string
}

export const PROVIDER_META: ProviderMeta[] = [
  {
    id: 'deepseek-v4-flash',
    shortLabel: 'DeepSeek',
    fullName: 'DeepSeek V4 Flash',
    modelId: 'ep-20260529231454-52v6k',
    vendor: '深度求索 DeepSeek',
  },
  {
    id: 'deepseek-v4-pro',
    shortLabel: 'DeepSeek',
    fullName: 'DeepSeek V4 Pro',
    modelId: 'ep-20260529233017-hdt4q',
    vendor: '深度求索 DeepSeek',
  },
  {
    id: 'doubao',
    shortLabel: '豆包',
    fullName: 'Doubao-Seed-2.0-lite',
    modelId: 'ep-20260520210121-c6jmk',
    vendor: '字节跳动 · 火山方舟',
  },
  {
    id: 'doubao-seed-2-pro',
    shortLabel: '豆包',
    fullName: 'Doubao-Seed-2.0-pro',
    modelId: 'ep-20260521203639-qbvlc',
    vendor: '字节跳动 · 火山方舟',
  },
]

export function getProviderMeta(id: Provider): ProviderMeta {
  return PROVIDER_META.find((p) => p.id === id) ?? PROVIDER_META[0]
}

/** @deprecated 使用 PROVIDER_META */
export const PROVIDERS = PROVIDER_META.map((p) => ({
  id: p.id,
  label: p.shortLabel,
}))
