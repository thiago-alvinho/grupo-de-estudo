import { test } from '@japa/runner'
import User from '#models/user'
import Notification from '#models/notification'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('User Notifications', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('unread notifications are counted accurately and cleared when marked as read', async ({
    assert,
  }) => {
    const user = await User.create({
      fullName: 'Usuário Notificação',
      email: 'notif@teste.com',
      password: 'password123',
    })

    const n1 = await Notification.create({
      userId: user.id,
      title: 'Aviso 1',
      message: 'Primeira notificação',
      isRead: false,
    })

    await Notification.create({
      userId: user.id,
      title: 'Aviso 2',
      message: 'Segunda notificação',
      isRead: false,
    })

    let unread = await Notification.query()
      .where('userId', user.id)
      .where('isRead', false)
      .count('* as total')
    assert.equal(Number(unread[0].$extras.total), 2)

    // Mark first as read
    n1.isRead = true
    await n1.save()

    unread = await Notification.query()
      .where('userId', user.id)
      .where('isRead', false)
      .count('* as total')
    assert.equal(Number(unread[0].$extras.total), 1)

    // Mark all as read
    await Notification.query()
      .where('userId', user.id)
      .where('isRead', false)
      .update({ isRead: true })

    unread = await Notification.query()
      .where('userId', user.id)
      .where('isRead', false)
      .count('* as total')
    assert.equal(Number(unread[0].$extras.total), 0)
  })
})
