interface EmptyStateProps {
  onSuggestion: (text: string) => void
}

const SUGGESTIONS = [
  '用三句话介绍什么是机器学习',
  '写一首关于春天的四句诗',
  '解释一下什么是 API',
]

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-2 text-[1.75rem] font-medium text-[#ececec]">有什么可以帮你的？</h1>
      <p className="mb-10 text-sm text-[#8e8e8e]">选择模型后开始与 InterSense 对话</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="rounded-full border border-[#3a3a3a] bg-[#2f2f2f] px-4 py-2.5 text-sm text-[#ececec] hover:bg-[#3a3a3a] transition-all duration-300"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
