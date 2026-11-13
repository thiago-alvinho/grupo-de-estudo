/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home').as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('/dashboard', [controllers.StudyTracks, 'index']).as('dashboard')

    router.get('/tracks', [controllers.StudyTracks, 'index']).as('tracks.index')
    router.get('/explore', [controllers.StudyTracks, 'explore']).as('tracks.explore')
    router.get('/tracks/create', [controllers.StudyTracks, 'create']).as('tracks.create')
    router.post('/tracks', [controllers.StudyTracks, 'store']).as('tracks.store')
    router.get('/tracks/:id', [controllers.StudyTracks, 'show']).as('tracks.show')
    router.get('/tracks/:id/edit', [controllers.StudyTracks, 'edit']).as('tracks.edit')
    router.put('/tracks/:id', [controllers.StudyTracks, 'update']).as('tracks.update')
    router.delete('/tracks/:id', [controllers.StudyTracks, 'destroy']).as('tracks.destroy')

    // Acesso compartilhado a trilhas (entrar em pública, senha e solicitação em privada)
    router.post('/tracks/:id/join', [controllers.TrackAccess, 'joinPublic']).as('tracks.join')
    router.delete('/tracks/:id/leave', [controllers.TrackAccess, 'leave']).as('tracks.leave')
    router
      .post('/tracks/:id/transfer-ownership', [controllers.TrackAccess, 'transferOwnership'])
      .as('tracks.transfer_ownership')
    router.post('/tracks/:id/unlock', [controllers.TrackAccess, 'unlockWithPassword']).as('tracks.unlock')
    router
      .post('/tracks/:id/request-access', [controllers.TrackAccess, 'requestAccess'])
      .as('tracks.request_access')
    router
      .post('/tracks/:id/members/:memberId/approve', [controllers.TrackAccess, 'approve'])
      .as('tracks.members.approve')
    router
      .post('/tracks/:id/members/:memberId/reject', [controllers.TrackAccess, 'reject'])
      .as('tracks.members.reject')
    router
      .delete('/tracks/:id/members/:memberId', [controllers.TrackAccess, 'removeMember'])
      .as('tracks.members.remove')

    // Eventos em tempo real (SSE)
    router.get('/realtime/events', [controllers.Realtime, 'stream']).as('realtime.events')

    router.post('/tracks/:trackId/lessons', [controllers.Lessons, 'store']).as('lessons.store')
    router.put('/tracks/:trackId/lessons/:id', [controllers.Lessons, 'update']).as('lessons.update')
    router
      .delete('/tracks/:trackId/lessons/:id', [controllers.Lessons, 'destroy'])
      .as('lessons.destroy')
    router
      .post('/tracks/:trackId/lessons/:id/toggle', [controllers.Lessons, 'toggleProgress'])
      .as('lessons.toggle_progress')
    router
      .post('/tracks/:trackId/lessons/:id/notes', [controllers.Lessons, 'saveNote'])
      .as('lessons.save_note')

    // Vídeos / Aulas (Buscar, Detalhar e Enviar)
    router.get('/videos', [controllers.VideosCatalog, 'index']).as('videos.index')
    router.get('/videos/create', [controllers.VideosCatalog, 'create']).as('videos.create')
    router.post('/videos', [controllers.VideosCatalog, 'store']).as('videos.store')
    router.get('/videos/:id', [controllers.VideosCatalog, 'show']).as('videos.show')

    // Notificações do Usuário
    router.get('/notifications', [controllers.Notifications, 'index']).as('notifications.index')
    router
      .post('/notifications/read-all', [controllers.Notifications, 'markAllAsRead'])
      .as('notifications.mark_all_read')
    router
      .post('/notifications/:id/read', [controllers.Notifications, 'markAsRead'])
      .as('notifications.mark_read')
    router
      .delete('/notifications/:id', [controllers.Notifications, 'destroy'])
      .as('notifications.destroy')

    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

// Rotas de BackOffice (BO) exclusivas para administradores
router
  .group(() => {
    router.get('/admin/users', [controllers.Backoffice, 'users']).as('admin.users')
    router
      .post('/admin/users/:id/toggle-role', [controllers.Backoffice, 'toggleRole'])
      .as('admin.users.toggle_role')
    router.get('/admin/videos', [controllers.Backoffice, 'videos']).as('admin.videos')
    router.delete('/admin/videos/:id', [controllers.Backoffice, 'destroyVideo']).as('admin.videos.destroy')
  })
  .use([middleware.auth(), middleware.admin()])
