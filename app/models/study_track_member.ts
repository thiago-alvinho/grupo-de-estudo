import { StudyTrackMemberSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import StudyTrack from '#models/study_track'

/**
 * StudyTrackMember records access requests and approved memberships
 * for private study tracks shared with other users.
 */
export default class StudyTrackMember extends StudyTrackMemberSchema {
  @belongsTo(() => StudyTrack)
  declare studyTrack: BelongsTo<typeof StudyTrack>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
