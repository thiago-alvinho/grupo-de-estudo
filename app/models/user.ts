import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { beforeCreate, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import StudyTrack from '#models/study_track'
import LessonProgress from '#models/lesson_progress'

/**
 * User model represents a user in the application.
 * It extends UserSchema and includes authentication capabilities
 * through the withAuthFinder mixin.
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @beforeCreate()
  static assignDefaultRole(user: User) {
    if (!user.role) {
      user.role = 'student'
    }
  }

  @hasMany(() => StudyTrack)
  declare studyTracks: HasMany<typeof StudyTrack>

  @hasMany(() => LessonProgress)
  declare lessonProgresses: HasMany<typeof LessonProgress>

  /**
   * Returns true when the user has the administrative role.
   */
  get isAdmin() {
    return this.role === 'admin'
  }

  /**
   * Get the user's initials from their full name or email.
   * Returns the first letter of first and last name if available,
   * otherwise returns the first two characters of the email username.
   */
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
