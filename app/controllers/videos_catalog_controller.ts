import Lesson from '#models/lesson'
import LessonProgress from '#models/lesson_progress'
import StudyTrack from '#models/study_track'
import StudyTrackMember from '#models/study_track_member'
import { extractYoutubeVideoId, lessonValidator } from '#validators/study_track'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * VideosCatalogController provides student-facing features to browse,
 * search, detail, and submit videos.
 */
export default class VideosCatalogController {
  /**
   * Search and explore videos accessible to the current user (Buscar Vídeos).
   */
  async index({ request, view, auth }: HttpContext) {
    const user = auth.user!
    const q = (request.input('q') || '').trim().toLowerCase()
    const trackId = request.input('trackId')

    // Find approved private track memberships for this user
    const approvedMemberships = await StudyTrackMember.query()
      .where('userId', user.id)
      .where('status', 'approved')
    const approvedTrackIds = approvedMemberships.map((m) => m.studyTrackId)

    // Find all tracks accessible to user
    const accessibleTracks = await StudyTrack.query()
      .where((query) => {
        query.where('userId', user.id).orWhere('isPublic', true)
        if (approvedTrackIds.length > 0) {
          query.orWhereIn('id', approvedTrackIds)
        }
      })
      .preload('user')
      .orderBy('title', 'asc')

    const accessibleTrackIds = accessibleTracks.map((t) => t.id)

    if (accessibleTrackIds.length === 0) {
      return view.render('pages/videos/index', {
        videos: [],
        tracks: [],
        searchTerm: q,
        selectedTrackId: trackId,
        totalCount: 0,
      })
    }

    const query = Lesson.query()
      .whereIn('studyTrackId', accessibleTrackIds)
      .preload('studyTrack', (tQuery) => {
        tQuery.preload('user')
      })
      .orderBy('createdAt', 'desc')

    if (trackId) {
      query.where('studyTrackId', trackId)
    }

    if (q) {
      const likePattern = `%${q}%`
      query.where((subQuery) => {
        subQuery
          .whereRaw('LOWER(title) LIKE ?', [likePattern])
          .orWhereHas('studyTrack', (trackQuery) => {
            trackQuery.whereRaw('LOWER(title) LIKE ?', [likePattern])
          })
      })
    }

    const lessons = await query

    // Check completion progress for this user
    const lessonIds = lessons.map((l) => l.id)
    const progresses =
      lessonIds.length > 0
        ? await LessonProgress.query().where('userId', user.id).whereIn('lessonId', lessonIds)
        : []
    const completedSet = new Set(progresses.map((p) => p.lessonId))

    const formattedVideos = lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      youtubeUrl: lesson.youtubeUrl,
      youtubeVideoId: lesson.youtubeVideoId,
      studyTrackId: lesson.studyTrackId,
      trackTitle: lesson.studyTrack?.title || 'Trilha',
      trackIsPublic: lesson.studyTrack?.isPublic || false,
      authorName:
        lesson.studyTrack?.user?.fullName || lesson.studyTrack?.user?.email || 'Instrutor',
      isCompleted: completedSet.has(lesson.id),
      createdAt: lesson.createdAt,
    }))

    return view.render('pages/videos/index', {
      videos: formattedVideos,
      tracks: accessibleTracks,
      searchTerm: q,
      selectedTrackId: trackId,
      totalCount: formattedVideos.length,
    })
  }

  /**
   * Detail a video (Detalhar Vídeos):
   * Opens the dedicated detail page with embedded player, metadata and notes.
   */
  async show({ params, view, auth, response }: HttpContext) {
    const user = auth.user!

    const lesson = await Lesson.query()
      .where('id', params.id)
      .preload('studyTrack', (query) => {
        query.preload('user')
      })
      .firstOrFail()

    // Ensure user has access to this track (public, owner, admin, or approved member)
    if (!lesson.studyTrack.isPublic && lesson.studyTrack.userId !== user.id && !user.isAdmin) {
      const approved = await StudyTrackMember.query()
        .where('studyTrackId', lesson.studyTrackId)
        .where('userId', user.id)
        .where('status', 'approved')
        .first()

      if (!approved) {
        return response.redirect().toRoute('tracks.show', { id: lesson.studyTrackId })
      }
    }

    const progress = await LessonProgress.query()
      .where('userId', user.id)
      .where('lessonId', lesson.id)
      .first()

    const otherLessons = await Lesson.query()
      .where('studyTrackId', lesson.studyTrackId)
      .orderBy('position', 'asc')

    return view.render('pages/videos/show', {
      lesson,
      track: lesson.studyTrack,
      isCompleted: Boolean(progress),
      otherLessons,
    })
  }

  /**
   * Show direct submission form for a video (Enviar Vídeo).
   */
  async create({ view, auth }: HttpContext) {
    const user = auth.user!

    // Find tracks owned by user (or public tracks if admin)
    const tracks = await StudyTrack.query()
      .where((query) => {
        if (user.isAdmin) {
          query.where('userId', user.id).orWhere('isPublic', true)
        } else {
          query.where('userId', user.id)
        }
      })
      .orderBy('title', 'asc')

    return view.render('pages/videos/create', { tracks })
  }

  /**
   * Process video submission (Enviar Vídeo).
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const trackId = request.input('studyTrackId')

    const track = await StudyTrack.query()
      .where('id', trackId)
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

    session.flash('success', `Vídeo "${lesson.title}" adicionado à trilha "${track.title}"!`)
    return response.redirect().toRoute('videos.show', { id: lesson.id })
  }
}
