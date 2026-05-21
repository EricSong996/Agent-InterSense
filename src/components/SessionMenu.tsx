import { createPortal } from 'react-dom'

interface SessionMenuProps {
  anchor: { top: number; left: number }
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}

export function SessionMenu({ anchor, onRename, onDelete, onClose }: SessionMenuProps) {
  const menuWidth = 128
  const left = Math.max(8, anchor.left - menuWidth)

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[9998] cursor-default bg-transparent"
        aria-label="关闭菜单"
        onClick={onClose}
      />
      <div
        className="fixed z-[9999] min-w-[128px] rounded-lg border border-[#3a3a3a] bg-[#2f2f2f] py-1 shadow-2xl shadow-black/50"
        style={{
          top: anchor.top - 4,
          left,
          transform: 'translateY(-100%)',
        }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-[#ececec] hover:bg-[#3a3a3a]"
          onClick={(e) => {
            e.stopPropagation()
            onRename()
          }}
        >
          重命名
        </button>
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#3a3a3a]"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          删除
        </button>
      </div>
    </>,
    document.body
  )
}
