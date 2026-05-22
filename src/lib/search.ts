import { CONFIG } from '../config'
import type { Message } from '../types'

export interface SearchHit {
  title: string
  url: string
  snippet: string
  date?: string
}

export function checkBochaKey(): string | null {
  const key = String(CONFIG.bocha.apiKey)
  if (!key || key === 'YOUR_BOCHA_API_KEY' || key.startsWith('YOUR_')) {
    return '请在 src/config.ts 中填写博查 API Key（open.bochaai.com）'
  }
  return null
}

function parseBochaResponse(json: unknown): SearchHit[] {
  const root = json as Record<string, unknown>
  const data = (root.data ?? root) as Record<string, unknown>
  const webPages = data.webPages as { value?: unknown[] } | undefined
  const items = webPages?.value ?? []

  return items
    .map((raw) => {
      const item = raw as Record<string, string>
      return {
        title: item.name || item.title || '无标题',
        url: item.url || '',
        snippet: item.summary || item.snippet || '',
        date: item.datePublished || item.dateLastCrawled || '',
      }
    })
    .filter((h) => h.url || h.snippet)
}

type BochaFreshness =
  | 'oneDay'
  | 'oneWeek'
  | 'oneMonth'
  | 'oneYear'
  | 'noLimit'

export async function bochaWebSearch(
  query: string,
  signal?: AbortSignal,
  options?: { count?: number; freshness?: BochaFreshness }
): Promise<SearchHit[]> {
  const res = await fetch(CONFIG.bocha.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.bocha.apiKey}`,
    },
    body: JSON.stringify({
      query,
      summary: true,
      freshness: options?.freshness ?? CONFIG.bocha.freshness,
      count: options?.count ?? CONFIG.bocha.count,
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    let msg = `博查搜索失败 (${res.status})`
    try {
      const j = JSON.parse(errText) as { message?: string; msg?: string }
      if (j.message) msg = j.message
      else if (j.msg) msg = j.msg
    } catch {
      if (errText) msg = errText.slice(0, 200)
    }
    throw new Error(msg)
  }

  const json = await res.json()
  const code = (json as { code?: number }).code
  if (code !== undefined && code !== 0 && code !== 200) {
    const msg =
      (json as { msg?: string; message?: string }).msg ||
      (json as { message?: string }).message ||
      '博查搜索返回错误'
    throw new Error(msg)
  }

  const hits = parseBochaResponse(json)
  // 有日期的结果优先把较新的排前面（简单字符串比较，博查多为 ISO 日期）
  return [...hits].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export function formatSearchContext(hits: SearchHit[]): string {
  if (hits.length === 0) {
    return '（未检索到相关网页结果，请结合已有知识回答，并说明信息可能不是最新的。）'
  }

  const today = new Date().toISOString().slice(0, 10)

  return hits
    .map((h, i) => {
      const dateLine = h.date ? `发布/更新：${h.date}` : '发布/更新：未知'
      return `[${i + 1}] 标题：${h.title}\n${dateLine}\n链接：${h.url}\n摘要：${h.snippet}`
    })
    .join('\n\n')
    .concat(`\n\n（检索请求日期：${today}，请优先采纳日期更近的来源。）`)
}

export function buildMessagesWithSearch(
  history: Message[],
  userContent: string,
  searchContext: string
): Message[] {
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const systemContent = `你是 InterSense 智能助手。当前日期：${today}。用户已开启联网搜索。

你必须遵守：
1. 优先根据下列【博查检索结果】回答，并标注来源序号或链接；
2. 若检索结果发布日期早于当前日期一年以上，应说明可能过时，勿当作「最新」；
3. 检索结果与用户问题无关或不足时，明确说明，不要编造「刚发布」的消息；
4. 不要声称你已自动联网，应说「根据检索到的网页」。

【博查检索结果】
${searchContext}`

  return [
    {
      id: crypto.randomUUID(),
      role: 'system',
      content: systemContent,
    },
    ...history,
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
    },
  ]
}
