import { StudyTrackSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Lesson from '#models/lesson'

/**
 * StudyTrack represents a collection of YouTube lessons created by a user
 * (private study track) or by an instructor/admin (public track).
 */
export default class StudyTrack extends StudyTrackSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Lesson)
  declare lessons: HasMany<typeof Lesson>
}
