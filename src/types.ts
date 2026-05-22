import type { Provider } from './config'

export type Role = 'user' | 'assistant' | 'system'

export interface MessageImage {
  id: string
  dataUrl: string
  mime: string
}

export interface Message {
  id: string
  role: Role
  content: string
  /** 用户消息附带的图片（base64 data URL） */
  images?: MessageImage[]
}

export interface ChatSession {
  id: string
  title: string
  /** 用户手动重命名后为 true，不再根据首条消息自动改标题 */
  titleUserSet?: boolean
  /** 置顶显示在列表最前 */
  pinned?: boolean
  pinnedAt?: number
  provider: Provider
  /** 开启后发送消息会先调用博查搜索 */
  webSearch: boolean
  messages: Message[]
  createdAt: number
  updatedAt: number
}

/** 输入框待发送图片 */
export interface PendingImage {
  id: string
  status: 'loading' | 'ready' | 'error'
  previewUrl: string
  dataUrl?: string
  mime?: string
  error?: string
}
