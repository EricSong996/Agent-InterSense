import { useEffect, useState } from 'react'
import { loadTimelySuggestions, pickFallbackSuggestions } from '../lib/suggestions'

interface EmptyStateProps {
  onSuggestion: (text: string) => void
}

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const [suggestions, setSuggestions] = useState(() => pickFallbackSuggestions(3))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ac = new AbortController()
    loadTimelySuggestions(ac.signal)
      .then((items) => {
        if (!ac.signal.aborted) setSuggestions(items)
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-2 text-[1.75rem] font-medium text-[#ececec]">有什么可以帮你的？</h1>
      <p className="mb-10 text-sm text-[#8e8e8e]">
        {loading ? '正在获取今日推荐问题…' : '选择模型后开始与 InterSense 对话'}
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className={`rounded-full border border-[#3a3a3a] bg-[#2f2f2f] px-4 py-2.5 text-sm text-[#ececec] hover:bg-[#3a3a3a] transition-all duration-300 ${
              loading ? 'animate-pulse opacity-80' : ''
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
