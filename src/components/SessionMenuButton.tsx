interface SessionMenuButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  /** 侧栏列表项：悬停才显示；顶栏：始终显示 */
  showOnHover?: boolean
}

export function SessionMenuButton({
  onClick,
  className = '',
  showOnHover = false,
}: SessionMenuButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-md p-1.5 text-[#8e8e8e] transition-all duration-300 hover:bg-[#3a3a3a] hover:text-[#ececec] ${
        showOnHover ? 'opacity-0 group-hover:opacity-100' : ''
      } ${className}`}
      aria-label="更多操作"
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
    >
      <span className="block text-base leading-none tracking-widest">⋯</span>
    </button>
  )
}
