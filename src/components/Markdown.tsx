import { useEffect, useRef } from 'react'
import { marked, Renderer } from 'marked'
import markedKatex from 'marked-katex-extension'
import katex from 'katex'
import hljs from 'highlight.js'

const defaultRenderer = new Renderer()
const MATH_CODE_LANGS = new Set(['latex', 'math', 'katex', 'tex'])

/** 保护代码块，避免其中的 $ 被误识别为公式 */
function protectCodeBlocks(src: string): { text: string; slots: string[] } {
  const slots: string[] = []
  const text = src.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    slots.push(match)
    return `\uE000CODE${slots.length - 1}\uE001`
  })
  return { text, slots }
}

function restoreCodeBlocks(text: string, slots: string[]): string {
  return text.replace(/\uE000CODE(\d+)\uE001/g, (_, i) => slots[Number(i)] ?? '')
}

/** 将 LaTeX 常用分隔符转为 marked-katex-extension 支持的 $ / $$ */
function normalizeMathDelimiters(src: string): string {
  const { text, slots } = protectCodeBlocks(src)
  let out = text
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_m, body: string) => `\n$$\n${body.trim()}\n$$\n`)
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_m, body: string) => `$${body.trim()}$`)
  return restoreCodeBlocks(out, slots)
}

marked.setOptions({
  breaks: true,
  gfm: true,
})

marked.use(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
  })
)

marked.use({
  renderer: {
    code(token) {
      const lang = (token.lang || '').toLowerCase()
      if (MATH_CODE_LANGS.has(lang)) {
        return `<div class="katex-display-wrap">${katex.renderToString(token.text, {
          displayMode: true,
          throwOnError: false,
        })}</div>\n`
      }
      return defaultRenderer.code.call(this, token)
    },
  },
})

export function Markdown({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const html = marked.parse(normalizeMathDelimiters(content)) as string
    ref.current.innerHTML = html
    ref.current.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  }, [content])

  return <div ref={ref} className="markdown-body text-[15px] text-[#ececec]" />
}
