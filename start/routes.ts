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
    router.get('/tracks/create', [controllers.StudyTracks, 'create']).as('tracks.create')
    router.post('/tracks', [controllers.StudyTracks, 'store']).as('tracks.store')
    router.get('/tracks/:id', [controllers.StudyTracks, 'show']).as('tracks.show')
    router.get('/tracks/:id/edit', [controllers.StudyTracks, 'edit']).as('tracks.edit')
    router.put('/tracks/:id', [controllers.StudyTracks, 'update']).as('tracks.update')
    router.delete('/tracks/:id', [controllers.StudyTracks, 'destroy']).as('tracks.destroy')

    router.post('/tracks/:trackId/lessons', [controllers.Lessons, 'store']).as('lessons.store')
    router.put('/tracks/:trackId/lessons/:id', [controllers.Lessons, 'update']).as('lessons.update')
    router
      .delete('/tracks/:trackId/lessons/:id', [controllers.Lessons, 'destroy'])
      .as('lessons.destroy')
    router
      .post('/tracks/:trackId/lessons/:id/toggle', [controllers.Lessons, 'toggleProgress'])
      .as('lessons.toggle_progress')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
