import { NotificationSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/**
 * Notification represents an alert or message sent to a user.
 */
export default class Notification extends NotificationSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
