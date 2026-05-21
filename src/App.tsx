import { useCallback, useEffect, useRef, useState } from 'react'
import type { Provider } from './config'
import { streamChat, checkApiKey } from './lib/api'
import {
  bochaWebSearch,
  buildMessagesWithSearch,
  checkBochaKey,
  formatSearchContext,
} from './lib/search'
import { loadActiveId, loadSessions, saveActiveId, saveSessions } from './lib/storage'
import type { ChatSession, Message } from './types'
import { Sidebar } from './components/Sidebar'
import { MessageBubble } from './components/MessageBubble'
import { ChatInput } from './components/ChatInput'
import { EmptyState } from './components/EmptyState'

type SessionBusy = 'searching' | 'streaming'

function uid() {
  return crypto.randomUUID()
}

function titleFromMessage(text: string) {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > 24 ? `${t.slice(0, 24)}…` : t || '新对话'
}

function createSession(provider: Provider = 'deepseek'): ChatSession {
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
  const [sessionBusy, setSessionBusy] = useState<Record<string, SessionBusy>>({})
  const abortBySession = useRef<Map<string, AbortController>>(new Map())
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find((s) => s.id === activeId) ?? null
  const activeBusy = activeId ? sessionBusy[activeId] : undefined

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, activeBusy])

  const updateSession = useCallback(
    (id: string, updater: (s: ChatSession) => ChatSession) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)))
    },
    []
  )

  const handleNewChat = () => {
    const s = createSession(activeSession?.provider ?? 'deepseek')
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
    updateSession(id, (s) => ({ ...s, title, updatedAt: Date.now() }))
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setSessions((prev) => {
      const next = [...prev]
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
      const s = createSession(activeSession?.provider ?? 'deepseek')
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
    userContent: string,
    webSearch: boolean,
    signal: AbortSignal
  ): Promise<Message[]> => {
    if (!webSearch) {
      return [...history, { id: uid(), role: 'user', content: userContent }]
    }

    const bochaErr = checkBochaKey()
    if (bochaErr) throw new Error(bochaErr)

    setBusy(sessionId, 'searching')
    try {
      const hits = await bochaWebSearch(userContent, signal)
      const context = formatSearchContext(hits)
      const built = buildMessagesWithSearch(
        history.map((m) => ({ role: m.role, content: m.content })),
        userContent,
        context
      )
      return built.map((m) => ({
        id: uid(),
        role: m.role,
        content: m.content,
      }))
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
      const userContent = last.content
      const msgsForApi = await resolveMessagesForApi(
        activeId,
        history.slice(0, -1),
        userContent,
        activeSession.webSearch,
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

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    let sessionId = activeId
    let session = activeSession

    if (!session) {
      const s = createSession('deepseek')
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
    setInput('')

    const userMsg: Message = { id: uid(), role: 'user', content: trimmed }
    const assistantId = uid()

    updateSession(sessionId!, (s) => {
      const isFirst = s.messages.length === 0
      return {
        ...s,
        title: isFirst ? titleFromMessage(trimmed) : s.title,
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
        trimmed,
        session!.webSearch,
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

  return (
    <div className="flex h-full bg-[#212121] text-[#ececec]">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        sidebarOpen={sidebarOpen}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onRename={handleRename}
        onReorder={handleReorder}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col bg-[#212121]">
        <header className="absolute left-0 right-0 top-0 z-10 flex h-12 items-center px-3 pointer-events-none">
          <button
            type="button"
            className="pointer-events-auto rounded-lg p-2 text-[#ececec] hover:bg-[#2a2a2a] md:hidden transition-colors duration-300"
            aria-label="打开菜单"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </button>
        </header>

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

        <div className="flex-1 overflow-y-auto pt-2">
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
          value={input}
          sendDisabled={!!activeBusy}
          webSearch={activeSession?.webSearch ?? false}
          onWebSearchChange={handleWebSearchChange}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          onProviderChange={handleProviderChange}
          provider={activeSession?.provider ?? 'deepseek'}
        />
      </main>
    </div>
  )
}
