interface SidebarToggleProps {
  /** 桌面端侧栏是否已收起 */
  collapsed: boolean
  onClick: () => void
  className?: string
}

/** 豆包风格：左栏面板开关图标 */
function IconSidebarPanel() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" strokeLinecap="round" />
    </svg>
  )
}

export function SidebarToggle({ collapsed, onClick, className = '' }: SidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
      title={collapsed ? '展开侧栏' : '收起侧栏'}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#ececec] transition-colors duration-200 hover:bg-[#2a2a2a] ${className}`}
    >
      <IconSidebarPanel />
    </button>
  )
}
