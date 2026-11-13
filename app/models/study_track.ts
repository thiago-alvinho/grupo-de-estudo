import { StudyTrackSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Lesson from '#models/lesson'
import StudyTrackMember from '#models/study_track_member'

/**
 * StudyTrack represents a collection of YouTube lessons created by a user
 * (private study track, optionally shared by password or approval) or public track.
 */
export default class StudyTrack extends StudyTrackSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Lesson)
  declare lessons: HasMany<typeof Lesson>

  @hasMany(() => StudyTrackMember)
  declare members: HasMany<typeof StudyTrackMember>
}
