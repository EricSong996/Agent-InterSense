import { useEffect, useRef, useState } from 'react'
import type { ChatSession } from '../types'
import { BrandLogo } from './BrandLogo'
import { SessionMenuButton } from './SessionMenuButton'
import type { SessionMenuAnchor } from './SessionMenu'

interface SidebarProps {
  sessions: ChatSession[]
  activeId: string | null
  /** 移动端抽屉是否打开 */
  sidebarOpen: boolean
  /** 桌面端是否收起（宽度动画） */
  sidebarCollapsed: boolean
  onNewChat: () => void
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  renamingId: string | null
  sessionMenuSessionId: string | null
  onOpenSessionMenu: (
    sessionId: string,
    el: HTMLElement,
    placement?: SessionMenuAnchor['placement']
  ) => void
  onCancelRename: () => void
  onCloseMobile: () => void
}

function IconNewChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8.25A2 2 0 0 1 6 6.25h3.1c.55 0 1.05.3 1.32.78l.83 1.22H18a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8.25Z"
      />
    </svg>
  )
}

function IconChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-[#8e8e8e] transition-transform duration-300 ease-in-out ${
        expanded ? '' : '-rotate-90'
      }`}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

function IconGrip() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-40">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

export function Sidebar({
  sessions,
  activeId,
  sidebarOpen,
  sidebarCollapsed,
  onNewChat,
  onSelect,
  onRename,
  onReorder,
  renamingId,
  sessionMenuSessionId,
  onOpenSessionMenu,
  onCancelRename,
  onCloseMobile,
}: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chatsExpanded, setChatsExpanded] = useState(true)
  const [renameValue, setRenameValue] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  const query = searchQuery.trim().toLowerCase()
  const filtered = query
    ? sessions.filter((s) => s.title.toLowerCase().includes(query))
    : sessions

  const idToIndex = new Map(sessions.map((s, i) => [s.id, i]))

  useEffect(() => {
    if (renamingId) {
      const s = sessions.find((x) => x.id === renamingId)
      setRenameValue(s?.title || '新对话')
      if (renameRef.current) {
        renameRef.current.focus()
        renameRef.current.select()
      }
    } else {
      setRenameValue('')
    }
  }, [renamingId, sessions])

  const commitRename = () => {
    if (!renamingId) return
    const title = renameValue.trim() || '新对话'
    onRename(renamingId, title)
    setRenameValue('')
  }

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    if (query) return
    const idx = idToIndex.get(sessionId)
    if (idx === undefined) return
    setDragIndex(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', sessionId)
  }

  const handleDragOver = (e: React.DragEvent, sessionId: string) => {
    e.preventDefault()
    if (query) return
    const idx = idToIndex.get(sessionId)
    if (idx !== undefined) setDropIndex(idx)
  }

  const handleDrop = (e: React.DragEvent, sessionId: string) => {
    e.preventDefault()
    if (query || dragIndex === null) return
    const toIdx = idToIndex.get(sessionId)
    if (toIdx !== undefined && dragIndex !== toIdx) {
      onReorder(dragIndex, toIdx)
    }
    setDragIndex(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDropIndex(null)
  }

  const navBtn =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#ececec] hover:bg-[#2a2a2a] transition-colors duration-300'

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-label="关闭侧栏"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`sidebar-panel fixed z-30 flex h-full shrink-0 flex-col overflow-hidden bg-[#171717] transition-[transform,width] duration-300 ease-in-out w-[260px] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:translate-x-0 ${
          sidebarCollapsed ? 'md:w-0 md:border-r-0' : 'md:w-[260px] md:border-r md:border-[#2a2a2a]/80'
        }`}
      >
        <div
          className={`flex h-full w-[260px] flex-col transition-opacity duration-300 ease-in-out ${
            sidebarCollapsed ? 'md:pointer-events-none md:opacity-0' : 'md:opacity-100'
          }`}
        >
        <div className="flex shrink-0 flex-col gap-1 p-3 pt-3">
          <div className="mb-2 flex h-10 items-center gap-2.5 px-1">
            <BrandLogo />
            <h1 className="brand-intersense text-[1.35rem] leading-none text-[#ececec] select-none">
              InterSense
            </h1>
          </div>

          <button type="button" className={navBtn} onClick={onNewChat}>
            <IconNewChat />
            <span>新对话</span>
          </button>

          <button
            type="button"
            className={navBtn}
            onClick={() => {
              setSearchOpen((o) => !o)
              if (searchOpen) setSearchQuery('')
            }}
          >
            <IconSearch />
            <span>搜索聊天</span>
          </button>

          {searchOpen && (
            <div className="px-1 pb-1">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索聊天名称…"
                className="w-full rounded-lg border border-[#3a3a3a] bg-[#212121] px-3 py-2 text-sm text-[#ececec] placeholder:text-[#6a6a6a] outline-none focus:border-[#5a5a5a] transition-colors duration-300"
                autoFocus
              />
            </div>
          )}
        </div>

        <nav className="sidebar-scroll flex min-h-0 flex-1 flex-col px-3 pb-2 pt-1">
          <button
            type="button"
            className={`${navBtn} mb-1`}
            aria-expanded={chatsExpanded}
            onClick={() => setChatsExpanded((e) => !e)}
          >
            <IconFolder />
            <span className="min-w-0 flex-1 text-left">全部聊天</span>
            <IconChevron expanded={chatsExpanded} />
          </button>

          <div
            className={`grid min-h-0 transition-[grid-template-rows] duration-300 ease-in-out ${
              chatsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div
              className={`min-h-0 ${chatsExpanded ? 'overflow-visible' : 'overflow-hidden'}`}
            >
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-xs text-[#8e8e8e]">
                  {query ? '没有匹配的聊天' : '暂无历史对话'}
                </p>
              )}
              <ul className="space-y-0.5">
            {filtered.map((s) => {
              const realIndex = idToIndex.get(s.id) ?? 0
              const isDragging = dragIndex === realIndex
              const isDropTarget = dropIndex === realIndex && dragIndex !== null && dragIndex !== realIndex

              return (
                <li
                  key={s.id}
                  draggable={!query && renamingId !== s.id}
                  onDragStart={(e) => handleDragStart(e, s.id)}
                  onDragOver={(e) => handleDragOver(e, s.id)}
                  onDrop={(e) => handleDrop(e, s.id)}
                  onDragEnd={handleDragEnd}
                  className={`chat-list-item rounded-lg transition-all duration-700 ease-in-out ${
                    isDragging ? 'opacity-40 scale-[0.98]' : ''
                  } ${isDropTarget ? 'ring-1 ring-[#5a5a5a] bg-[#2a2a2a]/50' : ''} ${
                    s.id === activeId ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]/60'
                  }`}
                >
                  {renamingId === s.id ? (
                    <div className="px-2 py-2">
                      <input
                        ref={renameRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') onCancelRename()
                        }}
                        className="w-full rounded-md border border-[#4a4a4a] bg-[#212121] px-2 py-1.5 text-sm text-[#ececec] outline-none focus:border-[#6a6a6a]"
                      />
                    </div>
                  ) : (
                    <div className="group relative flex items-center">
                      {!query && (
                        <span
                          className="ml-1 shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          aria-hidden
                        >
                          <IconGrip />
                        </span>
                      )}
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 pl-2 pr-8 text-left text-sm text-[#ececec]"
                        onClick={() => {
                          onSelect(s.id)
                          onCloseMobile()
                        }}
                      >
                        <span
                          className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#ececec]/85"
                          aria-hidden
                        />
                        <span className="truncate">{s.title || '新对话'}</span>
                      </button>
                      <SessionMenuButton
                        showOnHover
                        className={`absolute right-1 top-1/2 -translate-y-1/2 ${
                          sessionMenuSessionId === s.id ? 'opacity-100' : ''
                        }`}
                        onClick={(e) => onOpenSessionMenu(s.id, e.currentTarget, 'above')}
                      />
                    </div>
                  )}
                </li>
              )
            })}
              </ul>
            </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-[#2a2a2a]/80 p-3 text-[11px] text-[#6a6a6a]">
          InterSense · 小宋同学出品
        </div>
        </div>
      </aside>

    </>
  )
}
