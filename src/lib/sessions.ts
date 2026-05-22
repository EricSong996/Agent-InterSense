import type { ChatSession } from '../types'

/** 置顶在前（按置顶时间倒序），其余按最近更新排序 */
export function sortSessions(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    if (a.pinned && b.pinned) {
      return (b.pinnedAt ?? b.updatedAt) - (a.pinnedAt ?? a.updatedAt)
    }
    return b.updatedAt - a.updatedAt
  })
}
