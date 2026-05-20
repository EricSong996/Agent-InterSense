import { useState } from 'react'
import type { Message } from '../types'
import { Markdown } from './Markdown'

interface MessageBubbleProps {
  message: Message
  showActions?: boolean
  actionsDisabled?: boolean
  onCopy?: () => void
  onRegenerate?: () => void
}

function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconRegenerate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

export function MessageBubble({
  message,
  showActions,
  actionsDisabled,
  onCopy,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    if (!message.content.trim()) return
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-3">
        <div className="max-w-[85%] rounded-2xl bg-[#2f2f2f] px-4 py-2.5 text-[15px] leading-relaxed text-[#ececec] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="group/msg px-4 py-4">
      <div className="mx-auto max-w-3xl text-[15px] leading-relaxed">
        <Markdown content={message.content || '…'} />
        {showActions && (
          <div className="mt-3 flex items-center gap-1">
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={handleCopy}
              title="复制"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[#8e8e8e] transition-all duration-300 ease-in-out hover:bg-[#2a2a2a] hover:text-[#ececec] disabled:opacity-40"
            >
              <IconCopy />
              <span className="text-xs">{copied ? '已复制' : '复制'}</span>
            </button>
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={onRegenerate}
              title="重新生成"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[#8e8e8e] transition-all duration-300 ease-in-out hover:bg-[#2a2a2a] hover:text-[#ececec] disabled:opacity-40"
            >
              <IconRegenerate />
              <span className="text-xs">重新生成</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
