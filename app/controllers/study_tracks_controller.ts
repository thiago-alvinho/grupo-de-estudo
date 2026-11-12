import StudyTrack from '#models/study_track'
import LessonProgress from '#models/lesson_progress'
import { studyTrackValidator } from '#validators/study_track'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * StudyTracksController handles CRUD operations for a user's study tracks
 * and public platform tracks created by administrators, plus individual
 * progress calculation and the YouTube study player.
 */
export default class StudyTracksController {
  /**
   * List study tracks accessible to the authenticated user (their own tracks
   * plus official public tracks) with individual progress stats.
   */
  async index({ auth, view }: HttpContext) {
    const user = auth.user!

    const tracks = await StudyTrack.query()
      .where((query) => {
        query.where('userId', user.id).orWhere('isPublic', true)
      })
      .preload('user')
      .preload('lessons', (query) => {
        query.orderBy('position', 'asc').orderBy('id', 'asc')
      })
      .orderBy('isPublic', 'desc')
      .orderBy('createdAt', 'desc')

    const allLessonIds = tracks.flatMap((track) => track.lessons.map((lesson) => lesson.id))
    const completedProgresses =
      allLessonIds.length > 0
        ? await LessonProgress.query().where('userId', user.id).whereIn('lessonId', allLessonIds)
        : []

    const completedSet = new Set(completedProgresses.map((p) => p.lessonId))

    const tracksWithStats = tracks.map((track) => {
      const totalLessons = track.lessons.length
      const completedLessons = track.lessons.filter((l) => completedSet.has(l.id)).length
      const progressPercent =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      const canManage = track.userId === user.id || user.isAdmin

      return {
        id: track.id,
        userId: track.userId,
        title: track.title,
        description: track.description,
        isPublic: track.isPublic,
        canManage,
        authorName: track.user ? track.user.fullName || track.user.email : null,
        createdAt: track.createdAt,
        totalLessons,
        completedLessons,
        progressPercent,
      }
    })

    const summary = {
      totalTracks: tracksWithStats.length,
      totalLessons: tracksWithStats.reduce((acc, t) => acc + t.totalLessons, 0),
      completedLessons: tracksWithStats.reduce((acc, t) => acc + t.completedLessons, 0),
    }

    return view.render('pages/tracks/index', {
      tracks: tracksWithStats,
      summary,
    })
  }

  /**
   * Show the form for creating a new study track.
   */
  async create({ view }: HttpContext) {
    return view.render('pages/tracks/create')
  }

  /**
   * Store a newly created study track in the database.
   * Only administrators can create public tracks (isPublic = true).
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const { title, description, isPublic } = await request.validateUsing(studyTrackValidator)

    const track = await StudyTrack.create({
      userId: user.id,
      title,
      description: description || null,
      isPublic: user.isAdmin ? Boolean(isPublic) : false,
    })

    session.flash(
      'success',
      track.isPublic
        ? 'Disciplina pública criada com sucesso! Adicione as videoaulas abaixo.'
        : 'Trilha privada criada com sucesso! Adicione os vídeos do YouTube abaixo.'
    )
    return response.redirect().withQs(false).toRoute('tracks.show', { id: track.id })
  }

  /**
   * Display a single study track (private to owner or public), its YouTube player,
   * lesson playlist, and the authenticated user's individual progress.
   */
  async show({ params, request, view, auth }: HttpContext) {
    const user = auth.user!

    const track = await StudyTrack.query()
      .where('id', params.id)
      .where((query) => {
        query.where('userId', user.id).orWhere('isPublic', true)
      })
      .preload('user')
      .preload('lessons', (query) => {
        query.orderBy('position', 'asc').orderBy('id', 'asc')
      })
      .firstOrFail()

    const canManage = track.userId === user.id || user.isAdmin

    const lessonIds = track.lessons.map((l) => l.id)
    const progresses =
      lessonIds.length > 0
        ? await LessonProgress.query().where('userId', user.id).whereIn('lessonId', lessonIds)
        : []

    const completedSet = new Set(progresses.map((p) => p.lessonId))

    const lessons = track.lessons.map((lesson, index) => ({
      id: lesson.id,
      number: index + 1,
      title: lesson.title,
      youtubeUrl: lesson.youtubeUrl,
      youtubeVideoId: lesson.youtubeVideoId,
      position: lesson.position,
      isCompleted: completedSet.has(lesson.id),
    }))

    const requestedLessonId = Number(request.input('lesson'))
    const activeLesson =
      lessons.find((l) => l.id === requestedLessonId) ||
      lessons.find((l) => !l.isCompleted) ||
      lessons[0] ||
      null

    const totalLessons = lessons.length
    const completedLessons = lessons.filter((l) => l.isCompleted).length
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return view.render('pages/tracks/show', {
      track,
      canManage,
      lessons,
      activeLesson,
      totalLessons,
      completedLessons,
      progressPercent,
    })
  }

  /**
   * Show the form for editing an existing study track.
   */
  async edit({ params, view, auth }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.id)
      .where((query) => {
        if (!user.isAdmin) {
          query.where('userId', user.id)
        }
      })
      .firstOrFail()

    return view.render('pages/tracks/edit', { track })
  }

  /**
   * Update the study track title, description, and (for admins) visibility.
   */
  async update({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.id)
      .where((query) => {
        if (!user.isAdmin) {
          query.where('userId', user.id)
        }
      })
      .firstOrFail()

    const { title, description, isPublic } = await request.validateUsing(studyTrackValidator)

    track.title = title
    track.description = description || null
    if (user.isAdmin && isPublic !== undefined) {
      track.isPublic = Boolean(isPublic)
    }
    await track.save()

    session.flash('success', 'Trilha atualizada com sucesso!')
    return response.redirect().withQs(false).toRoute('tracks.show', { id: track.id })
  }

  /**
   * Delete a study track and all its lessons.
   */
  async destroy({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.id)
      .where((query) => {
        if (!user.isAdmin) {
          query.where('userId', user.id)
        }
      })
      .firstOrFail()

    await track.delete()

    session.flash('success', 'Trilha de estudo excluída.')
    return response.redirect().withQs(false).toRoute('tracks.index')
  }
}
