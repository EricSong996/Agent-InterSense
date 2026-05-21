import { useEffect, useRef, useState } from 'react'
import type { ChatSession } from '../types'
import { SessionMenu } from './SessionMenu'

interface SidebarProps {
  sessions: ChatSession[]
  activeId: string | null
  sidebarOpen: boolean
  onNewChat: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
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
  onNewChat,
  onSelect,
  onDelete,
  onRename,
  onReorder,
  onCloseMobile,
}: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<{
    sessionId: string
    top: number
    left: number
  } | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  const query = searchQuery.trim().toLowerCase()
  const filtered = query
    ? sessions.filter((s) => s.title.toLowerCase().includes(query))
    : sessions

  const idToIndex = new Map(sessions.map((s, i) => [s.id, i]))

  useEffect(() => {
    if (renamingId && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [renamingId])

  const openMenu = (sessionId: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    setMenuAnchor({ sessionId, top: rect.top, left: rect.right })
  }

  const startRename = (s: ChatSession) => {
    setMenuAnchor(null)
    setRenamingId(s.id)
    setRenameValue(s.title || '新对话')
  }

  const commitRename = () => {
    if (!renamingId) return
    const title = renameValue.trim() || '新对话'
    onRename(renamingId, title)
    setRenamingId(null)
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
        className={`fixed md:static z-30 flex h-full w-[260px] shrink-0 flex-col bg-[#171717] transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-1 p-3 pt-4">
          <h1 className="brand-intersense px-2 pb-3 text-[1.35rem] text-[#ececec] select-none">
            InterSense
          </h1>

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

        <nav className="flex-1 overflow-y-auto px-2 pb-2 pt-1">
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
                          if (e.key === 'Escape') {
                            setRenamingId(null)
                            setRenameValue('')
                          }
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
                          setMenuAnchor(null)
                        }}
                      >
                        <span
                          className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#ececec]/85"
                          aria-hidden
                        />
                        <span className="truncate">{s.title || '新对话'}</span>
                      </button>
                      <button
                        type="button"
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#8e8e8e] opacity-0 hover:bg-[#3a3a3a] hover:text-[#ececec] group-hover:opacity-100 transition-all duration-300"
                        aria-label="更多操作"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (menuAnchor?.sessionId === s.id) {
                            setMenuAnchor(null)
                          } else {
                            openMenu(s.id, e.currentTarget)
                          }
                        }}
                      >
                        ⋯
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-[#2a2a2a]/80 p-3 text-[11px] text-[#6a6a6a]">
          InterSense · 多模型对话
        </div>
      </aside>

      {menuAnchor && (() => {
        const target = sessions.find((x) => x.id === menuAnchor.sessionId)
        if (!target) return null
        return (
          <SessionMenu
            anchor={{ top: menuAnchor.top, left: menuAnchor.left }}
            onClose={() => setMenuAnchor(null)}
            onRename={() => startRename(target)}
            onDelete={() => {
              setMenuAnchor(null)
              onDelete(target.id)
            }}
          />
        )
      })()}
    </>
  )
}
