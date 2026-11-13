import { EventEmitter } from 'node:events'

export interface RealtimePayload {
  type: 'access_request' | 'access_response' | 'notification'
  title: string
  message: string
  link?: string | null
  trackId?: number
  unreadCount?: number
  member?: {
    id: number
    userName: string
    userEmail: string
    status: string
  }
}

/**
 * RealtimeService manages Server-Sent Events (SSE) channels per user
 * to deliver access requests and notifications in real time.
 */
class RealtimeService {
  private emitter = new EventEmitter()

  constructor() {
    this.emitter.setMaxListeners(1000)
  }

  subscribe(userId: number, listener: (payload: RealtimePayload) => void) {
    const channel = `user:${userId}`
    this.emitter.on(channel, listener)

    return () => {
      this.emitter.off(channel, listener)
    }
  }

  emitToUser(userId: number, payload: RealtimePayload) {
    const channel = `user:${userId}`
    this.emitter.emit(channel, payload)
  }
}

export default new RealtimeService()
