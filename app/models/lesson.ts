import { LessonSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import StudyTrack from '#models/study_track'
import LessonProgress from '#models/lesson_progress'

/**
 * Lesson represents a single YouTube video inside a StudyTrack.
 */
export default class Lesson extends LessonSchema {
  @belongsTo(() => StudyTrack)
  declare studyTrack: BelongsTo<typeof StudyTrack>

  @hasMany(() => LessonProgress)
  declare progresses: HasMany<typeof LessonProgress>
}
