import type { Provider } from '../config'
import { ModelSelector } from './ModelSelector'

interface ChatInputProps {
  value: string
  /** 仅当前会话在生成时禁用输入/发送 */
  sendDisabled: boolean
  provider: Provider
  webSearch: boolean
  onWebSearchChange: (enabled: boolean) => void
  onChange: (v: string) => void
  onSend: () => void
  onProviderChange: (provider: Provider) => void
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
  onWebSearchChange,
  onChange,
  onSend,
  onProviderChange,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!sendDisabled && value.trim()) onSend()
    }
  }

  return (
    <div className="shrink-0 bg-[#212121] px-4 pb-6 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          <ModelSelector provider={provider} onChange={onProviderChange} />
          <button
            type="button"
            onClick={() => onWebSearchChange(!webSearch)}
            title={webSearch ? '关闭联网搜索（博查）' : '开启联网搜索（博查）'}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all duration-200 ease-out ${
              webSearch
                ? 'border-[#10a37f]/50 bg-[#10a37f]/10 text-[#ececec]'
                : 'border-[#3a3a3a] bg-[#2f2f2f] text-[#8e8e8e] hover:border-[#4a4a4a] hover:text-[#ececec]'
            }`}
          >
            <IconGlobe active={webSearch} />
            <span>{webSearch ? '联网搜索 · 开' : '联网搜索'}</span>
          </button>
        </div>

        <div className="relative flex items-end rounded-[26px] border border-[#3a3a3a] bg-[#2f2f2f] shadow-md transition-all duration-200 focus-within:border-[#5a5a5a] focus-within:shadow-lg">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              sendDisabled
                ? '当前对话生成中，可切换其他聊天继续输入…'
                : webSearch
                  ? '输入问题，将先通过博查联网检索…'
                  : '有问题，尽管问'
            }
            rows={1}
            className="max-h-[200px] min-h-[52px] flex-1 resize-none bg-transparent px-5 py-4 text-[15px] text-[#ececec] placeholder:text-[#8e8e8e] outline-none"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            type="button"
            disabled={sendDisabled || !value.trim()}
            onClick={onSend}
            className="m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ececec] text-[#212121] disabled:opacity-30 hover:bg-white transition-all duration-200"
            aria-label="发送"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-[#5a5a5a]">
          {sendDisabled
            ? '当前对话生成中 · 可切换侧边栏到其他聊天'
            : webSearch
              ? '已开启博查联网 · 回答将参考检索结果'
              : 'InterSense 可能会犯错，请核查重要信息'}
        </p>
      </div>
    </div>
  )
}
