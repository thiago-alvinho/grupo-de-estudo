import realtimeService, { type RealtimePayload } from '#services/realtime_service'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * RealtimeController streams Server-Sent Events (SSE) to authenticated users
 * for real-time notifications and private track access requests.
 */
export default class RealtimeController {
  async stream({ auth, response, request }: HttpContext) {
    const user = auth.user!

    const res = response.response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    // Initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`)

    const unsubscribe = realtimeService.subscribe(user.id, (payload: RealtimePayload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    })

    // Keep-alive heartbeat every 25s
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n')
    }, 25000)

    request.request.on('close', () => {
      clearInterval(heartbeat)
      unsubscribe()
      res.end()
    })
  }
}
