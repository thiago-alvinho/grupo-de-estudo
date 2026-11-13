import Notification from '#models/notification'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * NotificationsController manages user notifications: listing,
 * marking as read (single or all), and deleting.
 */
export default class NotificationsController {
  /**
   * Display the user's notifications page.
   */
  async index({ auth, view }: HttpContext) {
    const user = auth.user!
    const notifications = await Notification.query()
      .where('userId', user.id)
      .orderBy('isRead', 'asc')
      .orderBy('createdAt', 'desc')

    const unreadCount = notifications.filter((n) => !n.isRead).length

    return view.render('pages/notifications/index', {
      notifications,
      unreadCount,
    })
  }

  /**
   * Mark a specific notification as read and optionally redirect to its link.
   */
  async markAsRead({ params, auth, response, session }: HttpContext) {
    const user = auth.user!
    const notification = await Notification.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    if (!notification.isRead) {
      notification.isRead = true
      await notification.save()
    }

    if (notification.link) {
      return response.redirect().withQs(false).toPath(notification.link)
    }

    session.flash('success', 'Notificação marcada como lida.')
    return response.redirect().toRoute('notifications.index')
  }

  /**
   * Mark all notifications of the authenticated user as read.
   */
  async markAllAsRead({ auth, response, session }: HttpContext) {
    const user = auth.user!
    await Notification.query()
      .where('userId', user.id)
      .where('isRead', false)
      .update({ isRead: true })

    session.flash('success', 'Todas as notificações foram marcadas como lidas.')
    return response.redirect().toRoute('notifications.index')
  }

  /**
   * Delete a notification.
   */
  async destroy({ params, auth, response, session }: HttpContext) {
    const user = auth.user!
    const notification = await Notification.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    await notification.delete()
    session.flash('success', 'Notificação removida.')
    return response.redirect().toRoute('notifications.index')
  }
}
