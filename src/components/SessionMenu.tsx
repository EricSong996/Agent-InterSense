import { createPortal } from 'react-dom'

export type SessionMenuPlacement = 'above' | 'below'

export interface SessionMenuAnchor {
  top: number
  left: number
  height?: number
  placement?: SessionMenuPlacement
}

interface SessionMenuProps {
  anchor: SessionMenuAnchor
  pinned?: boolean
  onPin: () => void
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

function IconRename() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
      />
    </svg>
  )
}

function IconDelete() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
    </svg>
  )
}

const itemBase =
  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-200'

export function SessionMenu({
  anchor,
  pinned,
  onPin,
  onRename,
  onDelete,
  onClose,
}: SessionMenuProps) {
  const menuWidth = 148
  const left = Math.max(8, Math.min(anchor.left - menuWidth, window.innerWidth - menuWidth - 8))
  const placement = anchor.placement ?? 'above'
  const top =
    placement === 'below'
      ? (anchor.top + (anchor.height ?? 0) + 6)
      : anchor.top - 6

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[9998] cursor-default bg-transparent"
        aria-label="关闭菜单"
        onClick={onClose}
      />
      <div
        className="fixed z-[9999] min-w-[148px] rounded-lg border border-[#3a3a3a] bg-[#2f2f2f] py-1 shadow-2xl shadow-black/50"
        style={{
          top,
          left,
          transform: placement === 'above' ? 'translateY(-100%)' : undefined,
        }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          className={`${itemBase} text-[#ececec] hover:bg-[#3a3a3a]`}
          onClick={(e) => {
            e.stopPropagation()
            onPin()
          }}
        >
          <IconPin />
          <span>{pinned ? '取消置顶' : '置顶聊天'}</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={`${itemBase} text-[#ececec] hover:bg-[#3a3a3a]`}
          onClick={(e) => {
            e.stopPropagation()
            onRename()
          }}
        >
          <IconRename />
          <span>重命名</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={`${itemBase} text-red-400 hover:bg-[#3a3a3a]`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <IconDelete />
          <span>删除</span>
        </button>
      </div>
    </>,
    document.body
  )
}
