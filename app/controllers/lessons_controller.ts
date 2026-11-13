import StudyTrack from '#models/study_track'
import StudyTrackMember from '#models/study_track_member'
import Lesson from '#models/lesson'
import LessonProgress from '#models/lesson_progress'
import LessonNote from '#models/lesson_note'
import { extractYoutubeVideoId, lessonValidator } from '#validators/study_track'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * LessonsController manages YouTube video lessons inside a StudyTrack
 * and tracks completion progress per authenticated user.
 */
export default class LessonsController {
  /**
   * Add a new YouTube video lesson to a study track (owner or admin only).
   */
  async store({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.trackId)
      .where((query) => {
        if (!user.isAdmin) {
          query.where('userId', user.id)
        }
      })
      .firstOrFail()

    const { title, youtubeUrl } = await request.validateUsing(lessonValidator)
    const youtubeVideoId = extractYoutubeVideoId(youtubeUrl)!

    const lastLesson = await Lesson.query()
      .where('studyTrackId', track.id)
      .orderBy('position', 'desc')
      .first()

    const nextPosition = lastLesson ? lastLesson.position + 1 : 1

    const lesson = await Lesson.create({
      studyTrackId: track.id,
      title,
      youtubeUrl,
      youtubeVideoId,
      position: nextPosition,
    })

    session.flash('success', 'Vídeo adicionado à trilha!')
    return response
      .redirect()
      .withQs({ lesson: lesson.id })
      .toRoute('tracks.show', { id: track.id })
  }

  /**
   * Update a lesson's title or YouTube URL (owner or admin only).
   */
  async update({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.trackId)
      .where((query) => {
        if (!user.isAdmin) {
          query.where('userId', user.id)
        }
      })
      .firstOrFail()

    const lesson = await Lesson.query()
      .where('id', params.id)
      .where('studyTrackId', track.id)
      .firstOrFail()

    const { title, youtubeUrl } = await request.validateUsing(lessonValidator)
    const youtubeVideoId = extractYoutubeVideoId(youtubeUrl)!

    lesson.title = title
    lesson.youtubeUrl = youtubeUrl
    lesson.youtubeVideoId = youtubeVideoId
    await lesson.save()

    session.flash('success', 'Aula atualizada com sucesso!')
    return response
      .redirect()
      .withQs({ lesson: lesson.id })
      .toRoute('tracks.show', { id: track.id })
  }

  /**
   * Delete a lesson from a study track (owner or admin only).
   */
  async destroy({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.trackId)
      .where((query) => {
        if (!user.isAdmin) {
          query.where('userId', user.id)
        }
      })
      .firstOrFail()

    const lesson = await Lesson.query()
      .where('id', params.id)
      .where('studyTrackId', track.id)
      .firstOrFail()

    await lesson.delete()

    session.flash('success', 'Aula removida da trilha.')
    return response.redirect().withQs(false).toRoute('tracks.show', { id: track.id })
  }

  private async findAccessibleTrack(trackId: number, userId: number, isAdmin: boolean) {
    const track = await StudyTrack.findOrFail(trackId)
    if (track.isPublic || track.userId === userId || isAdmin) {
      return track
    }
    const member = await StudyTrackMember.query()
      .where('studyTrackId', track.id)
      .where('userId', userId)
      .where('status', 'approved')
      .first()
    if (!member) {
      return null
    }
    return track
  }

  /**
   * Toggle completion status of a lesson for the authenticated user.
   */
  async toggleProgress({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const trackId = Number(params.trackId)
    const track = await this.findAccessibleTrack(trackId, user.id, user.isAdmin)

    if (!track) {
      session.flash('error', 'Acesso não autorizado a esta trilha privada.')
      return response.redirect().toRoute('tracks.show', { id: trackId })
    }

    const lesson = await Lesson.query()
      .where('id', params.id)
      .where('studyTrackId', track.id)
      .firstOrFail()

    const existing = await LessonProgress.query()
      .where('userId', user.id)
      .where('lessonId', lesson.id)
      .first()

    if (existing) {
      await existing.delete()
      session.flash('success', 'Aula marcada como pendente.')
    } else {
      await LessonProgress.create({
        userId: user.id,
        lessonId: lesson.id,
        completedAt: DateTime.now(),
      })
      session.flash('success', 'Aula concluída! Progresso salvo.')
    }

    const activeLessonId = request.input('activeLessonId') || lesson.id
    return response
      .redirect()
      .withQs({ lesson: activeLessonId })
      .toRoute('tracks.show', { id: track.id })
  }

  /**
   * Save or update personal notes for a lesson in the database.
   */
  async saveNote({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const trackId = Number(params.trackId)
    const track = await this.findAccessibleTrack(trackId, user.id, user.isAdmin)

    if (!track) {
      if (request.accepts(['html', 'json']) === 'json' || request.ajax()) {
        return response.forbidden({ error: 'Acesso não autorizado a esta trilha privada.' })
      }
      session.flash('error', 'Acesso não autorizado a esta trilha privada.')
      return response.redirect().toRoute('tracks.show', { id: trackId })
    }

    const lesson = await Lesson.query()
      .where('id', params.id)
      .where('studyTrackId', track.id)
      .firstOrFail()

    const content = String(request.input('content', '')).slice(0, 10000)

    await LessonNote.updateOrCreate({ userId: user.id, lessonId: lesson.id }, { content })

    const savedAt = DateTime.now().setZone('America/Sao_Paulo').toFormat('HH:mm')

    if (request.accepts(['html', 'json']) === 'json' || request.ajax()) {
      return response.json({ success: true, savedAt })
    }

    session.flash('success', 'Anotação salva com sucesso!')
    return response
      .redirect()
      .withQs({ lesson: lesson.id })
      .toRoute('tracks.show', { id: track.id })
  }
}
