import User from '#models/user'
import Lesson from '#models/lesson'
import StudyTrack from '#models/study_track'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * BackofficeController handles administrator actions for managing
 * users and videos across the entire platform.
 */
export default class BackofficeController {
  /**
   * List all users registered on the platform with their statistics (BO).
   */
  async users({ view }: HttpContext) {
    const users = await User.query()
      .preload('studyTracks')
      .preload('lessonProgresses')
      .orderBy('createdAt', 'desc')

    const stats = {
      totalUsers: users.length,
      totalAdmins: users.filter((u) => u.isAdmin).length,
      totalStudents: users.filter((u) => !u.isAdmin).length,
    }

    const usersWithStats = users.map((u) => ({
      id: u.id,
      fullName: u.fullName || 'Sem nome informado',
      email: u.email,
      role: u.role,
      isAdmin: u.isAdmin,
      initials: u.initials,
      createdAt: u.createdAt,
      tracksCount: u.studyTracks.length,
      completedLessonsCount: u.lessonProgresses.length,
    }))

    return view.render('pages/admin/users/index', {
      users: usersWithStats,
      stats,
    })
  }

  /**
   * Toggle a user's role between 'student' and 'admin' (BO).
   */
  async toggleRole({ params, auth, response, session }: HttpContext) {
    const currentUser = auth.user!
    const targetUser = await User.findOrFail(params.id)

    if (currentUser.id === targetUser.id) {
      session.flash('error', 'Você não pode alterar seu próprio nível de acesso.')
      return response.redirect().toRoute('admin.users')
    }

    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin'
    targetUser.role = nextRole
    await targetUser.save()

    session.flash(
      'success',
      `Papel do usuário ${targetUser.email} atualizado para ${nextRole === 'admin' ? 'Administrador' : 'Estudante'}.`
    )
    return response.redirect().toRoute('admin.users')
  }

  /**
   * List all videos (lessons) registered across the platform with filtering (BO).
   */
  async videos({ request, view }: HttpContext) {
    const q = (request.input('q') || '').trim().toLowerCase()
    const trackId = request.input('trackId')

    const query = Lesson.query()
      .preload('studyTrack', (tQuery) => {
        tQuery.preload('user')
      })
      .orderBy('createdAt', 'desc')

    if (trackId) {
      query.where('studyTrackId', trackId)
    }

    const allLessons = await query
    const tracks = await StudyTrack.query().orderBy('title', 'asc')

    const filteredLessons = q
      ? allLessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            (l.studyTrack && l.studyTrack.title.toLowerCase().includes(q))
        )
      : allLessons

    const stats = {
      totalVideos: allLessons.length,
      totalTracks: tracks.length,
    }

    return view.render('pages/admin/lessons/index', {
      lessons: filteredLessons,
      tracks,
      selectedTrackId: trackId,
      searchTerm: q,
      stats,
    })
  }

  /**
   * Delete a video directly from the BackOffice.
   */
  async destroyVideo({ params, response, session }: HttpContext) {
    const lesson = await Lesson.findOrFail(params.id)
    const title = lesson.title
    await lesson.delete()

    session.flash('success', `Vídeo "${title}" excluído do sistema.`)
    return response.redirect().toRoute('admin.videos')
  }
}
