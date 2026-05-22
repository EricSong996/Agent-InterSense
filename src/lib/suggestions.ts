import { bochaWebSearch, checkBochaKey, type SearchHit } from './search'

const CACHE_KEY = 'agent-timely-suggestions'
const CACHE_TTL_MS = 30 * 60 * 1000

const TIMELY_QUERIES = [
  '今日热点新闻',
  '最新科技资讯',
  '本周社会要闻',
  '近日财经动态',
  '国际时事 最新',
  '体育资讯 今日',
  '文娱热点 最近',
  '人工智能 行业动态',
]

const FALLBACK_SUGGESTIONS = [
  '用三句话介绍什么是机器学习',
  '写一首关于春天的四句诗',
  '解释一下什么是 API',
  '推荐几本适合入门的经济学读物',
  '如何高效制定一周学习计划',
  '简述量子计算和传统计算的区别',
  '有哪些改善睡眠质量的小技巧',
  '帮我列一份周末城市漫步路线',
  '什么是大模型的上下文窗口',
  '用通俗语言讲讲通货膨胀',
  '如何写一份简洁的会议纪要',
  '介绍几种常见的思维导图用法',
  '零基础如何开始学 Python',
  '谈谈可再生能源的主要类型',
  '怎样准备一场 5 分钟演讲',
  '解释区块链能解决什么问题',
  '推荐几部提高审美的纪录片',
  '如何礼貌地拒绝不合理请求',
  '什么是提示词工程',
  '简述光合作用的基本过程',
]

type TemplateFn = (topic: string) => string

const QUESTION_TEMPLATES: TemplateFn[] = [
  (t) => `「${t}」是怎么回事？帮我梳理要点`,
  (t) => `最近关于「${t}」有哪些值得关注的进展？`,
  (t) => `用通俗的话讲讲：${t}`,
  (t) => `「${t}」背后有哪些争议或不同观点？`,
  (t) => `帮我用三句话总结「${t}」`,
  (t) => `${t}——这对普通人有什么影响？`,
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

function truncateTopic(title: string, max = 20): string {
  const t = title.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function cleanTitle(title: string): string | null {
  const t = title
    .replace(/\s*[-_|]\s*.+$/, '')
    .replace(/[_【】[\]()（）]/g, '')
    .trim()
  if (t.length < 4 || t.length > 48) return null
  if (/^(首页|登录|404|无标题|搜索结果)/.test(t)) return null
  return t
}

function hitToSuggestion(hit: SearchHit): string | null {
  const topic = cleanTitle(hit.title)
  if (!topic) return null
  const short = truncateTopic(topic)
  const tpl = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)]
  const q = tpl(short)
  return q.length > 42 ? `${q.slice(0, 40)}…` : q
}

function hitsToSuggestions(hits: SearchHit[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const h of shuffle(hits)) {
    const q = hitToSuggestion(h)
    if (!q || seen.has(q)) continue
    seen.add(q)
    out.push(q)
    if (out.length >= 8) break
  }
  return out
}

function readCache(): string[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { at, items } = JSON.parse(raw) as { at: number; items: string[] }
    if (Date.now() - at > CACHE_TTL_MS || !items?.length) return null
    return items
  } catch {
    return null
  }
}

function writeCache(items: string[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items }))
  } catch {
    /* quota */
  }
}

export function pickFallbackSuggestions(count = 3): string[] {
  return pickN(FALLBACK_SUGGESTIONS, count)
}

async function fetchFromBocha(signal?: AbortSignal): Promise<string[]> {
  const query = TIMELY_QUERIES[Math.floor(Math.random() * TIMELY_QUERIES.length)]
  const hits = await bochaWebSearch(query, signal, {
    count: 10,
    freshness: 'oneWeek',
  })
  return hitsToSuggestions(hits)
}

/**
 * 加载 3 条推荐问题：优先博查热点（时事），失败则随机本地题库。
 */
export async function loadTimelySuggestions(signal?: AbortSignal): Promise<string[]> {
  const cached = readCache()
  if (cached && cached.length >= 3) {
    return pickN(cached, 3)
  }

  if (!checkBochaKey()) {
    const fallback = pickFallbackSuggestions(3)
    writeCache(fallback)
    return fallback
  }

  try {
    const fromWeb = await fetchFromBocha(signal)
    if (fromWeb.length >= 3) {
      writeCache(fromWeb)
      return pickN(fromWeb, 3)
    }
  } catch {
    /* 回退 */
  }

  const fallback = pickFallbackSuggestions(3)
  writeCache(fallback)
  return fallback
}
