import type { Provider } from './config'

export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
}

export interface ChatSession {
  id: string
  title: string
  provider: Provider
  /** 开启后发送消息会先调用博查搜索 */
  webSearch: boolean
  messages: Message[]
  createdAt: number
  updatedAt: number
}
