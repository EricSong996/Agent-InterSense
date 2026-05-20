import { useEffect, useRef } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function Markdown({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const html = marked.parse(content) as string
    ref.current.innerHTML = html
    ref.current.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  }, [content])

  return <div ref={ref} className="markdown-body text-[15px] text-[#ececec]" />
}
