import type { Provider } from '../config'
import type { ChatSession } from '../types'

const STORAGE_KEY = 'agent-chat-sessions'
const ACTIVE_KEY = 'agent-chat-active-id'
const SIDEBAR_COLLAPSED_KEY = 'agent-sidebar-collapsed'

function migrateProvider(provider: unknown): Provider {
  if (provider === 'deepseek') return 'deepseek-v4-flash'
  if (
    provider === 'deepseek-v4-flash' ||
    provider === 'deepseek-v4-pro' ||
    provider === 'doubao' ||
    provider === 'doubao-seed-2-pro'
  ) {
    return provider
  }
  return 'deepseek-v4-flash'
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    return parsed.map((s) => ({
      ...s,
      provider: migrateProvider(s.provider),
      webSearch: s.webSearch ?? false,
    }))
  } catch {
    return []
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActiveId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
}
