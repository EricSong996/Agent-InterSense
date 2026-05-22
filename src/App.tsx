import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Provider } from './config'
import { streamChat, checkApiKey } from './lib/api'
import {
  bochaWebSearch,
  buildMessagesWithSearch,
  checkBochaKey,
  formatSearchContext,
} from './lib/search'
import {
  loadActiveId,
  loadSessions,
  loadSidebarCollapsed,
  saveActiveId,
  saveSessions,
  saveSidebarCollapsed,
} from './lib/storage'
import { SidebarToggle } from './components/SidebarToggle'
import { messageHasImages } from './lib/images'
import type { ChatSession, Message, MessageImage } from './types'
import { SessionMenu, type SessionMenuAnchor } from './components/SessionMenu'
import { SessionMenuButton } from './components/SessionMenuButton'
import { Sidebar } from './components/Sidebar'
import { sortSessions } from './lib/sessions'
import { MessageBubble } from './components/MessageBubble'
import { ChatInput } from './components/ChatInput'
import { EmptyState } from './components/EmptyState'

type SessionBusy = 'searching' | 'streaming'

function uid() {
  return crypto.randomUUID()
}

function titleFromMessage(text: string, hasImages?: boolean) {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t) return t.length > 24 ? `${t.slice(0, 24)}…` : t
  if (hasImages) return '图片对话'
  return '新对话'
}

function createSession(provider: Provider = 'deepseek-v4-flash'): ChatSession {
  const now = Date.now()
  return {
    id: uid(),
    title: '新对话',
    provider,
    webSearch: false,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions())
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId())
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadSidebarCollapsed())
  const [sessionMenu, setSessionMenu] = useState<{
    sessionId: string
    anchor: SessionMenuAnchor
  } | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  const [sessionBusy, setSessionBusy] = useState<Record<string, SessionBusy>>({})
  const abortBySession = useRef<Map<string, AbortController>>(new Map())
  const bottomRef = useRef<HTMLDivElement>(null)

  const sortedSessions = useMemo(() => sortSessions(sessions), [sessions])
  const activeSession = sortedSessions.find((s) => s.id === activeId) ?? null
  const activeBusy = activeId ? sessionBusy[activeId] : undefined
  const menuSession = sessionMenu
    ? sortedSessions.find((s) => s.id === sessionMenu.sessionId)
    : null

  const setBusy = useCallback((sessionId: string, state: SessionBusy | null) => {
    setSessionBusy((prev) => {
      const next = { ...prev }
      if (state) next[sessionId] = state
      else delete next[sessionId]
      return next
    })
  }, [])

  const beginAbort = useCallback((sessionId: string) => {
    abortBySession.current.get(sessionId)?.abort()
    const ac = new AbortController()
    abortBySession.current.set(sessionId, ac)
    return ac
  }, [])

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  useEffect(() => {
    saveActiveId(activeId)
  }, [activeId])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, activeBusy])

  const updateSession = useCallback(
    (id: string, updater: (s: ChatSession) => ChatSession) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)))
    },
    []
  )

  const toggleSidebar = useCallback(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (isDesktop) {
      setSidebarCollapsed((c) => {
        const next = !c
        saveSidebarCollapsed(next)
        return next
      })
    } else {
      setSidebarOpen((o) => !o)
    }
  }, [])

  const handleNewChat = () => {
    const s = createSession(activeSession?.provider ?? 'deepseek-v4-flash')
    setSessions((prev) => [s, ...prev])
    setActiveId(s.id)
    setInput('')
    setError(null)
    setSidebarOpen(false)
  }

  const handleSelect = (id: string) => {
    setActiveId(id)
    setError(null)
  }

  const handleDelete = (id: string) => {
    abortBySession.current.get(id)?.abort()
    abortBySession.current.delete(id)
    setBusy(id, null)
    setSessionMenu((m) => (m?.sessionId === id ? null : m))
    setRenamingId((r) => (r === id ? null : r))
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (activeId === id) {
        const fallback = next[0]?.id ?? null
        setActiveId(fallback)
      }
      return next
    })
  }

  const handleRename = (id: string, title: string) => {
    updateSession(id, (s) => ({
      ...s,
      title,
      titleUserSet: true,
      updatedAt: Date.now(),
    }))
    setRenamingId(null)
  }

  const handlePin = (id: string) => {
    setSessions((prev) =>
      sortSessions(
        prev.map((s) => {
          if (s.id !== id) return s
          const pinned = !s.pinned
          return {
            ...s,
            pinned,
            pinnedAt: pinned ? Date.now() : undefined,
            updatedAt: Date.now(),
          }
        })
      )
    )
    setSessionMenu(null)
  }

  const openSessionMenu = (
    sessionId: string,
    el: HTMLElement,
    placement: SessionMenuAnchor['placement'] = 'above'
  ) => {
    const rect = el.getBoundingClientRect()
    setSessionMenu((prev) => {
      if (prev?.sessionId === sessionId) return null
      return {
        sessionId,
        anchor: {
          top: rect.top,
          left: rect.right,
          height: rect.height,
          placement,
        },
      }
    })
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setSessions((prev) => {
      const sorted = sortSessions(prev)
      const next = [...sorted]
      const [removed] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, removed)
      return next
    })
  }

  const handleProviderChange = (provider: Provider) => {
    if (!activeId) return
    updateSession(activeId, (s) => ({ ...s, provider, updatedAt: Date.now() }))
  }

  const handleWebSearchChange = (enabled: boolean) => {
    if (!activeId) {
      const s = createSession(activeSession?.provider ?? 'deepseek-v4-flash')
      s.webSearch = enabled
      setSessions((prev) => [s, ...prev])
      setActiveId(s.id)
      return
    }
    updateSession(activeId, (s) => ({ ...s, webSearch: enabled, updatedAt: Date.now() }))
  }

  const resolveMessagesForApi = async (
    sessionId: string,
    history: Message[],
    userMsg: Message,
    webSearch: boolean,
    signal: AbortSignal
  ): Promise<Message[]> => {
    if (!webSearch || messageHasImages(userMsg)) {
      return [...history, userMsg]
    }

    const query = userMsg.content.trim()
    if (!query) return [...history, userMsg]

    const bochaErr = checkBochaKey()
    if (bochaErr) throw new Error(bochaErr)

    setBusy(sessionId, 'searching')
    try {
      const hits = await bochaWebSearch(query, signal)
      const context = formatSearchContext(hits)
      return buildMessagesWithSearch(history, query, context)
    } finally {
      setBusy(sessionId, null)
    }
  }

  const streamAssistantReply = async (
    sessionId: string,
    history: Message[],
    provider: Provider,
    assistantId: string,
    signal: AbortSignal
  ) => {
    setBusy(sessionId, 'streaming')
    try {
      await streamChat(
        provider,
        history,
        (chunk) => {
          updateSession(sessionId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            ),
            updatedAt: Date.now(),
          }))
        },
        signal
      )
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      const msg = e instanceof Error ? e.message : '发送失败'
      setError(msg)
      updateSession(sessionId, (s) => ({
        ...s,
        messages: s.messages.filter((m) => m.id !== assistantId),
      }))
      throw e
    } finally {
      setBusy(sessionId, null)
    }
  }

  const handleRegenerate = async (assistantMsgId: string) => {
    if (!activeId || !activeSession || activeBusy) return

    const idx = activeSession.messages.findIndex((m) => m.id === assistantMsgId)
    if (idx < 0 || activeSession.messages[idx].role !== 'assistant') return

    const history = activeSession.messages.slice(0, idx)
    const last = history[history.length - 1]
    if (!last || last.role !== 'user') return

    const provider = activeSession.provider
    const keyErr = checkApiKey(provider)
    if (keyErr) {
      setError(keyErr)
      return
    }

    setError(null)
    const signal = beginAbort(activeId).signal

    const newAssistantId = uid()
    updateSession(activeId, (s) => ({
      ...s,
      messages: [...history, { id: newAssistantId, role: 'assistant', content: '' }],
      updatedAt: Date.now(),
    }))

    try {
      const msgsForApi = await resolveMessagesForApi(
        activeId,
        history.slice(0, -1),
        last,
        activeSession.webSearch && !messageHasImages(last),
        signal
      )
      await streamAssistantReply(
        activeId,
        msgsForApi,
        provider,
        newAssistantId,
        signal
      )
    } catch (e) {
      if ((e as Error).name !== 'AbortError' && e instanceof Error) {
        setError(e.message)
      }
    }
  }

  const sendMessage = async (payload: { text: string; images: MessageImage[] }) => {
    const trimmed = payload.text.trim()
    const images = payload.images
    if (!trimmed && images.length === 0) return

    let sessionId = activeId
    let session = activeSession

    if (!session) {
      const s = createSession('deepseek-v4-flash')
      setSessions((prev) => [s, ...prev])
      setActiveId(s.id)
      sessionId = s.id
      session = s
    }

    if (sessionBusy[sessionId!]) return

    const provider = session!.provider
    const keyErr = checkApiKey(provider)
    if (keyErr) {
      setError(keyErr)
      return
    }

    setError(null)

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      content: trimmed,
      ...(images.length > 0 ? { images } : {}),
    }
    const assistantId = uid()
    const useWebSearch = session!.webSearch && !messageHasImages(userMsg)

    updateSession(sessionId!, (s) => {
      const isFirst = s.messages.length === 0
      return {
        ...s,
        title:
          isFirst && !s.titleUserSet
            ? titleFromMessage(trimmed, images.length > 0)
            : s.title,
        messages: [
          ...s.messages,
          userMsg,
          { id: assistantId, role: 'assistant', content: '' },
        ],
        updatedAt: Date.now(),
      }
    })

    const signal = beginAbort(sessionId!).signal

    try {
      const msgsForApi = await resolveMessagesForApi(
        sessionId!,
        session!.messages,
        userMsg,
        useWebSearch,
        signal
      )
      await streamAssistantReply(
        sessionId!,
        msgsForApi,
        provider,
        assistantId,
        signal
      )
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setBusy(sessionId!, null)
        return
      }
      if (e instanceof Error) setError(e.message)
    }
  }

  const messages = activeSession?.messages ?? []
  const showEmpty = messages.length === 0 && !activeBusy
  const sidebarExpanded = isDesktop ? !sidebarCollapsed : sidebarOpen

  return (
    <div className="flex h-full bg-[#212121] text-[#ececec]">
      <Sidebar
        sessions={sortedSessions}
        activeId={activeId}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        renamingId={renamingId}
        sessionMenuSessionId={sessionMenu?.sessionId ?? null}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onRename={handleRename}
        onReorder={handleReorder}
        onOpenSessionMenu={openSessionMenu}
        onCancelRename={() => setRenamingId(null)}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col bg-[#212121]">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#2a2a2a]/60 px-3">
          <SidebarToggle
            collapsed={!sidebarExpanded}
            onClick={toggleSidebar}
          />
          {activeId && activeSession && (
            <SessionMenuButton
              onClick={(e) => openSessionMenu(activeId, e.currentTarget, 'below')}
            />
          )}
        </header>

        {sessionMenu && menuSession && (
          <SessionMenu
            anchor={sessionMenu.anchor}
            pinned={menuSession.pinned}
            onPin={() => handlePin(menuSession.id)}
            onRename={() => {
              setSessionMenu(null)
              setRenamingId(menuSession.id)
            }}
            onDelete={() => {
              setSessionMenu(null)
              handleDelete(menuSession.id)
            }}
            onClose={() => setSessionMenu(null)}
          />
        )}

        {error && (
          <div className="mx-4 mt-3 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-2 text-sm text-red-300">
            {error}
            {error.includes('CORS') || error.includes('Failed to fetch') ? (
              <span className="block mt-1 text-xs text-red-400/80">
                可能是浏览器跨域限制，请尝试本地运行或配置 API 代理。
              </span>
            ) : null}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {showEmpty ? (
            <EmptyState onSuggestion={(t) => setInput(t)} />
          ) : (
            <div className="pb-4 pt-2">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1
                const showActions =
                  m.role === 'assistant' &&
                  m.content.trim().length > 0 &&
                  !(activeBusy && isLast)

                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    showActions={showActions}
                    actionsDisabled={!!activeBusy}
                    onRegenerate={() => handleRegenerate(m.id)}
                  />
                )
              })}
              {activeBusy && (
                <div className="px-4 py-2 text-sm text-[#8e8e8e] animate-pulse">
                  {activeBusy === 'searching' ? '正在联网搜索…' : '正在思考…'}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <ChatInput
          key={activeId ?? 'new'}
          sessionKey={activeId}
          value={input}
          sendDisabled={!!activeBusy}
          webSearch={activeSession?.webSearch ?? false}
          onWebSearchChange={handleWebSearchChange}
          onChange={setInput}
          onSend={sendMessage}
          onImageError={setError}
          onProviderChange={handleProviderChange}
          provider={activeSession?.provider ?? 'deepseek-v4-flash'}
        />
      </main>
    </div>
  )
}
