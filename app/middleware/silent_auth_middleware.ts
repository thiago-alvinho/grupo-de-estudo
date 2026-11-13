import Notification from '#models/notification'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Silent auth middleware can be used as a global middleware to silent check
 * if the user is logged-in or not.
 *
 * Also shares unread notifications count with all Edge views.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    if (ctx.auth.user) {
      const result = await Notification.query()
        .where('userId', ctx.auth.user.id)
        .where('isRead', false)
        .count('* as total')

      const unreadCount = Number(result[0]?.$extras.total || 0)
      ctx.view.share({ unreadNotificationsCount: unreadCount })
    } else {
      ctx.view.share({ unreadNotificationsCount: 0 })
    }

    return next()
  }
}
