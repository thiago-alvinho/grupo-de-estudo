import { LessonNoteSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Lesson from '#models/lesson'

/**
 * LessonNote represents personal notes written by a user for a specific lesson,
 * persisted in the database.
 */
export default class LessonNote extends LessonNoteSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Lesson)
  declare lesson: BelongsTo<typeof Lesson>
}
