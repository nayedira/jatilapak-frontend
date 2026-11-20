import { authSession } from './session'
import { uuid } from './uuid'
import type { ChatMessage, ChatMeetingPoint } from './api/chat'
import { mockSocket } from './api/mockChat'

export type ChatEvent =
  | { type: 'status'; data: 'connecting' | 'open' | 'closed' }
  | { type: 'auth.ok' }
  | { type: 'message.created'; data: ChatMessage }
  | { type: 'message.read'; data: { room_id: string; reader_id: string; chat_ids: string[]; read_at: string } }
  | { type: 'meeting_point.updated'; data: ChatMeetingPoint }
  | { type: 'error'; data: { code: string; message: string } }

export interface ChatSocket {
  send(text: string, clientId: string): boolean // false = belum tersambung, pakai REST
  markRead(ids: string[]): void
  close(): void
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API = import.meta.env.VITE_API_BASE_URL as string
const WS_BASE = (import.meta.env.VITE_WS_BASE_URL as string | undefined) || API.replace(/^http/, 'ws')

function realSocket(roomId: string, onEvent: (e: ChatEvent) => void, lastId: () => string | null): ChatSocket {
  let ws: WebSocket | null = null
  let authed = false
  let closed = false
  let retry = 0
  let pingTimer: ReturnType<typeof setInterval> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined

  const stopPing = () => { if (pingTimer) clearInterval(pingTimer); pingTimer = undefined }

  function open() {
    onEvent({ type: 'status', data: 'connecting' })
    const sock = new WebSocket(`${WS_BASE}/ws/chat/${encodeURIComponent(roomId)}`)
    ws = sock

    // Autentikasi lewat pesan pertama (batas 5 detik di server), bukan query string.
    sock.onopen = () => {
      sock.send(JSON.stringify({
        type: 'auth', request_id: uuid(),
        data: { token: authSession.token(), last_chat_id: lastId() },
      }))
    }

    sock.onmessage = (e) => {
      let msg: { type?: string }
      try { msg = JSON.parse(String(e.data)) } catch { return }
      switch (msg.type) {
        case 'auth.ok':
          authed = true
          retry = 0
          stopPing()
          pingTimer = setInterval(() => {
            if (sock.readyState === WebSocket.OPEN) {
              sock.send(JSON.stringify({ type: 'ping', data: { timestamp: new Date().toISOString() } }))
            }
          }, 30000)
          onEvent({ type: 'status', data: 'open' })
          onEvent({ type: 'auth.ok' })
          break
        case 'message.created':
        case 'message.read':
        case 'meeting_point.updated':
        case 'error':
          onEvent(msg as unknown as ChatEvent)
          break
      }
    }

    sock.onclose = () => {
      authed = false
      stopPing()
      onEvent({ type: 'status', data: 'closed' })
      if (!closed) retryTimer = setTimeout(open, Math.min(15000, 1000 * 2 ** retry++))
    }
  }

  open()

  return {
    send(text, clientId) {
      if (!authed || ws?.readyState !== WebSocket.OPEN) return false
      ws.send(JSON.stringify({ type: 'message.send', request_id: uuid(), data: { client_message_id: clientId, teks_pesan: text } }))
      return true
    },
    markRead(ids) {
      if (authed && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message.read', request_id: uuid(), data: { chat_ids: ids } }))
      }
    },
    close() {
      closed = true
      if (retryTimer) clearTimeout(retryTimer)
      stopPing()
      ws?.close()
    },
  }
}

export function connectChat(roomId: string, onEvent: (e: ChatEvent) => void, lastId: () => string | null): ChatSocket {
  return USE_MOCK ? mockSocket(roomId, onEvent) : realSocket(roomId, onEvent, lastId)
}