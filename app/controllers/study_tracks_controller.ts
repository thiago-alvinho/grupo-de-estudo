import StudyTrack from '#models/study_track'
import StudyTrackMember from '#models/study_track_member'
import LessonProgress from '#models/lesson_progress'
import LessonNote from '#models/lesson_note'
import Notification from '#models/notification'
import User from '#models/user'
import { studyTrackValidator } from '#validators/study_track'
import hash from '@adonisjs/core/services/hash'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * StudyTracksController handles CRUD operations for a user's study tracks
 * and public platform tracks created by administrators, plus individual
 * progress calculation and the YouTube study player.
 */
export default class StudyTracksController {
  /**
   * List ONLY the study tracks that the currently logged-in user created
   * or explicitly joined/unlocked (status === 'approved').
   */
  async index({ auth, view }: HttpContext) {
    const user = auth.user!

    const approvedMemberships = await StudyTrackMember.query()
      .where('userId', user.id)
      .where('status', 'approved')
    const approvedTrackIds = approvedMemberships.map((m) => m.studyTrackId)

    const tracks = await StudyTrack.query()
      .where((query) => {
        query.where('userId', user.id)
        if (approvedTrackIds.length > 0) {
          query.orWhereIn('id', approvedTrackIds)
        }
      })
      .preload('user')
      .preload('lessons', (query) => {
        query.orderBy('position', 'asc').orderBy('id', 'asc')
      })
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
        isLocked: false,
        memberStatus: track.userId === user.id ? 'owner' : 'approved',
        hasPassword: Boolean(track.accessPassword),
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
   * Explore all study tracks created on the platform (public and private),
   * allowing the user to join public tracks or unlock/request private ones.
   */
  async explore({ auth, view }: HttpContext) {
    const user = auth.user!

    const tracks = await StudyTrack.query()
      .preload('user')
      .preload('lessons')
      .orderBy('createdAt', 'desc')

    const memberships = await StudyTrackMember.query().where('userId', user.id)
    const membershipMap = new Map(memberships.map((m) => [m.studyTrackId, m.status]))

    const allTracks = tracks.map((track) => {
      const isOwner = track.userId === user.id
      const memberStatus = membershipMap.get(track.id) || null
      const hasJoined = isOwner || memberStatus === 'approved'
      const isLocked = !track.isPublic && !isOwner && memberStatus !== 'approved' && !user.isAdmin

      return {
        id: track.id,
        userId: track.userId,
        title: track.title,
        description: track.description,
        isPublic: track.isPublic,
        isOwner,
        hasJoined,
        isLocked,
        memberStatus,
        hasPassword: Boolean(track.accessPassword),
        authorName: track.user ? track.user.fullName || track.user.email : 'Comunidade',
        createdAt: track.createdAt,
        totalLessons: track.lessons.length,
      }
    })

    return view.render('pages/tracks/explore', {
      tracks: allTracks,
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
   * Both students and administrators can create public or private tracks.
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const { title, description, isPublic, accessPassword } =
      await request.validateUsing(studyTrackValidator)

    const trackIsPublic = Boolean(isPublic)
    const hashedPassword =
      !trackIsPublic && accessPassword ? await hash.make(accessPassword) : null

    const track = await StudyTrack.create({
      userId: user.id,
      title,
      description: description || null,
      isPublic: trackIsPublic,
      accessPassword: hashedPassword,
    })

    if (track.isPublic) {
      const otherUsers = await User.query().whereNot('id', user.id).select('id')
      if (otherUsers.length > 0) {
        await Notification.createMany(
          otherUsers.map((recipient) => ({
            userId: recipient.id,
            title: 'Nova trilha pública disponível!',
            message: `${user.fullName || user.email} publicou a trilha "${track.title}".`,
            link: `/tracks/${track.id}`,
            isRead: false,
          }))
        )
      }
    }

    session.flash(
      'success',
      track.isPublic
        ? 'Trilha pública criada com sucesso! Todos os estudantes da plataforma poderão estudar por ela.'
        : 'Trilha privada criada com sucesso! Adicione os vídeos do YouTube abaixo.'
    )
    return response.redirect().withQs(false).toRoute('tracks.show', { id: track.id })
  }

  /**
   * Display a single study track, its unlock/request screen if private and
   * user is not authorized yet, or its YouTube player and access management.
   */
  async show({ params, request, view, auth }: HttpContext) {
    const user = auth.user!

    const track = await StudyTrack.query()
      .where('id', params.id)
      .preload('user')
      .preload('lessons', (query) => {
        query.orderBy('position', 'asc').orderBy('id', 'asc')
      })
      .firstOrFail()

    const isOwner = track.userId === user.id
    const canManage = isOwner || user.isAdmin

    const membership = !isOwner
      ? await StudyTrackMember.query()
          .where('studyTrackId', track.id)
          .where('userId', user.id)
          .first()
      : null

    const isMember = membership?.status === 'approved'
    const hasAccess = track.isPublic || canManage || isMember

    if (!hasAccess) {
      return view.render('pages/tracks/unlock', {
        track,
        membership,
        hasPassword: Boolean(track.accessPassword),
        lessonsCount: track.lessons.length,
      })
    }

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

    let activeNote = ''
    if (activeLesson) {
      const noteRecord = await LessonNote.query()
        .where('userId', user.id)
        .where('lessonId', activeLesson.id)
        .first()
      activeNote = noteRecord?.content || ''
    }

    let pendingMembers: StudyTrackMember[] = []
    let approvedMembers: StudyTrackMember[] = []

    if (canManage && !track.isPublic) {
      const allMembers = await StudyTrackMember.query()
        .where('studyTrackId', track.id)
        .preload('user')
        .orderBy('createdAt', 'desc')

      pendingMembers = allMembers.filter((m) => m.status === 'pending')
      approvedMembers = allMembers.filter((m) => m.status === 'approved')
    }

    const transferCandidates = canManage
      ? await User.query()
          .whereNot('id', track.userId)
          .orderBy('fullName', 'asc')
          .orderBy('email', 'asc')
      : []

    return view.render('pages/tracks/show', {
      track,
      isOwner,
      isMember,
      canManage,
      lessons,
      activeLesson,
      activeNote,
      totalLessons,
      completedLessons,
      progressPercent,
      pendingMembers,
      approvedMembers,
      transferCandidates,
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
      .preload('user')
      .firstOrFail()

    const transferCandidates = await User.query()
      .whereNot('id', track.userId)
      .orderBy('fullName', 'asc')
      .orderBy('email', 'asc')

    return view.render('pages/tracks/edit', {
      track,
      isOwner: track.userId === user.id,
      transferCandidates,
    })
  }

  /**
   * Update the study track title, description, and visibility.
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

    const { title, description, isPublic, accessPassword, removePassword } =
      await request.validateUsing(studyTrackValidator)

    track.title = title
    track.description = description || null
    if (isPublic !== undefined) {
      track.isPublic = Boolean(isPublic)
    }

    if (track.isPublic || removePassword) {
      track.accessPassword = null
    } else if (accessPassword) {
      track.accessPassword = await hash.make(accessPassword)
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
