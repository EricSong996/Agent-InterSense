import { useCallback, useEffect, useRef, useState } from 'react'
import type { Provider } from '../config'
import {
  MAX_IMAGES_PER_MESSAGE,
  processImageFile,
  providerSupportsVision,
  revokePendingPreview,
  visionUnsupportedHint,
} from '../lib/images'
import type { MessageImage, PendingImage } from '../types'
import { ImageAttachmentChip } from './ImageAttachmentChip'
import { ModelSelector } from './ModelSelector'

interface ChatInputProps {
  value: string
  sendDisabled: boolean
  provider: Provider
  webSearch: boolean
  sessionKey: string | null
  onWebSearchChange: (enabled: boolean) => void
  onChange: (v: string) => void
  onSend: (payload: { text: string; images: MessageImage[] }) => void
  onProviderChange: (provider: Provider) => void
  onImageError?: (message: string) => void
}

function IconGlobe({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={active ? 'text-[#10a37f]' : 'text-[#8e8e8e]'}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export function ChatInput({
  value,
  sendDisabled,
  provider,
  webSearch,
  sessionKey,
  onWebSearchChange,
  onChange,
  onSend,
  onProviderChange,
  onImageError,
}: ChatInputProps) {
  const [pending, setPending] = useState<PendingImage[]>([])
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const readyCount = pending.filter((p) => p.status === 'ready').length
  const loadingCount = pending.filter((p) => p.status === 'loading').length
  const canSend =
    !sendDisabled &&
    loadingCount === 0 &&
    (value.trim().length > 0 || readyCount > 0)

  useEffect(() => {
    return () => {
      pendingRef.current.forEach(revokePendingPreview)
    }
  }, [])

  useEffect(() => {
    setPending((prev) => {
      prev.forEach(revokePendingPreview)
      return []
    })
  }, [sessionKey])

  const upsertPending = useCallback((item: PendingImage) => {
    setPending((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx < 0) return [...prev, item]
      const old = prev[idx]
      if (old.previewUrl !== item.previewUrl && old.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(old.previewUrl)
      }
      const next = [...prev]
      next[idx] = item
      return next
    })
  }, [])

  const removePending = useCallback((id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) revokePendingPreview(item)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      const slots = MAX_IMAGES_PER_MESSAGE - pendingRef.current.filter((p) => p.status !== 'error').length
      if (slots <= 0) {
        onImageError?.(`最多添加 ${MAX_IMAGES_PER_MESSAGE} 张图片`)
        return
      }

      const batch = files.slice(0, slots)
      if (files.length > slots) {
        onImageError?.(`最多添加 ${MAX_IMAGES_PER_MESSAGE} 张图片，已忽略多余文件`)
      }

      await Promise.all(batch.map((file) => processImageFile(file, upsertPending)))
    },
    [onImageError, upsertPending]
  )

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const dt = e.clipboardData
    if (!dt) return

    const fromFiles = [...(dt.files ?? [])].filter((f) => f.type.startsWith('image/'))
    const fromItems =
      fromFiles.length > 0 ? fromFiles : [...dt.items].flatMap((item) => {
        if (item.kind !== 'file' || !item.type.startsWith('image/')) return []
        const f = item.getAsFile()
        return f ? [f] : []
      })

    if (fromItems.length > 0) {
      e.preventDefault()
      void addFiles(fromItems)
    }
  }

  const handleSend = () => {
    if (!canSend) return
    const images: MessageImage[] = pending
      .filter((p) => p.status === 'ready' && p.dataUrl)
      .map((p) => ({
        id: p.id,
        dataUrl: p.dataUrl!,
        mime: p.mime ?? 'image/jpeg',
      }))
    onSend({ text: value.trim(), images })
    onChange('')
    setPending((prev) => {
      prev.forEach(revokePendingPreview)
      return []
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasImages = pending.length > 0
  const visionOk = providerSupportsVision(provider)

  return (
    <div className="shrink-0 bg-[#212121] px-4 pb-6 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <ModelSelector provider={provider} onChange={onProviderChange} />
          <button
            type="button"
            onClick={() => onWebSearchChange(!webSearch)}
            disabled={hasImages}
            title={
              hasImages
                ? '含图片的消息暂不支持联网搜索'
                : webSearch
                  ? '关闭联网搜索（博查）'
                  : '开启联网搜索（博查）'
            }
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40 ${
              webSearch && !hasImages
                ? 'border-[#10a37f]/50 bg-[#10a37f]/10 text-[#ececec]'
                : 'border-[#3a3a3a] bg-[#2f2f2f] text-[#8e8e8e] hover:border-[#4a4a4a] hover:text-[#ececec]'
            }`}
          >
            <IconGlobe active={webSearch && !hasImages} />
            <span>{webSearch && !hasImages ? '联网搜索 · 开' : '联网搜索'}</span>
          </button>
        </div>

        <div
          className={`rounded-[26px] border bg-[#2f2f2f] shadow-md transition-all duration-200 focus-within:border-[#5a5a5a] focus-within:shadow-lg ${
            hasImages ? 'border-[#4a4a4a] p-2' : 'border-[#3a3a3a]'
          }`}
        >
          {hasImages && (
            <div className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
              {pending.map((item) => (
                <ImageAttachmentChip
                  key={item.id}
                  item={item}
                  onRemove={() => removePending(item.id)}
                />
              ))}
            </div>
          )}

          <div className="relative flex items-end">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder={
                sendDisabled
                  ? '当前对话生成中，可切换其他聊天继续输入…'
                  : hasImages
                    ? '描述你的问题，例如：解这道数学题…'
                    : '有问题尽管问，可直接粘贴图片'
              }
              rows={1}
              className="max-h-[200px] min-h-[52px] flex-1 resize-none bg-transparent px-4 py-4 text-[15px] text-[#ececec] placeholder:text-[#8e8e8e] outline-none"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={handleSend}
              className="m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ececec] text-[#212121] disabled:opacity-30 hover:bg-white transition-all duration-200"
              aria-label="发送"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-[#5a5a5a]">
          {sendDisabled
            ? '当前对话生成中 · 可切换侧边栏到其他聊天'
            : loadingCount > 0
              ? '图片处理中…'
              : hasImages && webSearch
                ? '含图片时已自动跳过联网搜索'
                : hasImages && !visionOk
                  ? visionUnsupportedHint(provider)
                  : hasImages
                    ? '已添加图片 · 拍题请尽量使用豆包 Seed 2.0 模型'
                    : 'InterSense 可能会犯错，请核查重要信息'}
        </p>
      </div>
    </div>
  )
}
