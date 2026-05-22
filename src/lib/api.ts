import { CONFIG, type Provider } from '../config'
import { defaultImagePrompt, messageHasImages } from './images'
import type { Message } from '../types'

function getProviderConfig(provider: Provider) {
  return CONFIG[provider]
}

function isDeepseekProvider(provider: Provider): boolean {
  return provider === 'deepseek-v4-flash' || provider === 'deepseek-v4-pro'
}

function isDoubaoProvider(provider: Provider): boolean {
  return provider === 'doubao' || provider === 'doubao-seed-2-pro'
}

function isConfigured(provider: Provider): boolean {
  const c = getProviderConfig(provider)
  const key = String(c.apiKey)
  const model = String(c.model)
  if (isDeepseekProvider(provider)) {
    return key.length > 0 && !key.startsWith('YOUR_')
  }
  if (isDoubaoProvider(provider)) {
    return key.length > 0 && !key.startsWith('YOUR_') && model.startsWith('ep-')
  }
  return false
}

export function checkApiKey(provider: Provider): string | null {
  if (!isConfigured(provider)) {
    return isDeepseekProvider(provider)
      ? '请在 src/config.ts 中填写 DeepSeek API Key'
      : '请在 src/config.ts 中填写豆包 API Key 与接入点 ID'
  }
  return null
}

type ApiContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export function messageToApiContent(m: Message): string | ApiContentPart[] {
  const images = m.images ?? []
  if (images.length === 0) return m.content

  const parts: ApiContentPart[] = []
  const text = m.content.trim()
  if (text) parts.push({ type: 'text', text })
  for (const img of images) {
    parts.push({ type: 'image_url', image_url: { url: img.dataUrl } })
  }
  if (parts.length === 0) {
    parts.push({ type: 'text', text: defaultImagePrompt() })
  }
  return parts
}

export async function streamChat(
  provider: Provider,
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const cfg = getProviderConfig(provider)
  const url = `${cfg.baseUrl}/chat/completions`

  const body = {
    model: cfg.model,
    messages: messages
      .filter((m) => m.role !== 'system' || m.content.trim() || messageHasImages(m))
      .map((m) => ({
        role: m.role,
        content: messageToApiContent(m),
      })),
    stream: true,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    let msg = `请求失败 (${res.status})`
    try {
      const j = JSON.parse(errText) as { error?: { message?: string } }
      if (j.error?.message) msg = j.error.message
    } catch {
      if (errText) msg = errText.slice(0, 200)
    }
    throw new Error(msg)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const content = parsed.choices?.[0]?.delta?.content
        if (content) onChunk(content)
      } catch {
        /* ignore malformed SSE chunks */
      }
    }
  }
}
