import { test } from '@japa/runner'
import User from '#models/user'
import StudyTrack from '#models/study_track'
import Lesson from '#models/lesson'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Video Search & Catalog', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('search queries filter lessons by title correctly', async ({ assert }) => {
    const user = await User.create({
      fullName: 'Aluno Pesquisa',
      email: 'pesquisa@teste.com',
      password: 'password123',
    })

    const track = await StudyTrack.create({
      userId: user.id,
      title: 'Física Clássica',
      description: 'Mecânica e Termodinâmica',
      isPublic: false,
    })

    await Lesson.create({
      studyTrackId: track.id,
      title: 'Cinemática Escalar',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: 'dQw4w9WgXcQ',
      position: 1,
    })

    await Lesson.create({
      studyTrackId: track.id,
      title: 'Leis de Newton',
      youtubeUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      youtubeVideoId: 'aqz-KE-bpKQ',
      position: 2,
    })

    // Search for "Newton"
    const results = await Lesson.query()
      .where('studyTrackId', track.id)
      .whereLike('title', '%Newton%')

    assert.lengthOf(results, 1)
    assert.equal(results[0].title, 'Leis de Newton')
  })

  test('public videos are visible to other students while private remain secluded', async ({
    assert,
  }) => {
    const teacher = await User.create({
      fullName: 'Professor',
      email: 'prof@teste.com',
      password: 'password123',
      role: 'admin',
    })

    const student = await User.create({
      fullName: 'Aluno',
      email: 'aluno@teste.com',
      password: 'password123',
      role: 'student',
    })

    const publicTrack = await StudyTrack.create({
      userId: teacher.id,
      title: 'Álgebra Linear Pública',
      isPublic: true,
    })

    const privateTrack = await StudyTrack.create({
      userId: teacher.id,
      title: 'Anotações Pessoais do Prof',
      isPublic: false,
    })

    const publicLesson = await Lesson.create({
      studyTrackId: publicTrack.id,
      title: 'Espaços Vetoriais',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: 'dQw4w9WgXcQ',
      position: 1,
    })

    await Lesson.create({
      studyTrackId: privateTrack.id,
      title: 'Rascunho Privado',
      youtubeUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      youtubeVideoId: 'aqz-KE-bpKQ',
      position: 1,
    })

    // Student queries accessible tracks among the test tracks
    const accessibleTracks = await StudyTrack.query()
      .whereIn('id', [publicTrack.id, privateTrack.id])
      .where((q) => {
        q.where('userId', student.id).orWhere('isPublic', true)
      })

    const accessibleTrackIds = accessibleTracks.map((t) => t.id)
    const accessibleLessons = await Lesson.query().whereIn('studyTrackId', accessibleTrackIds)

    assert.lengthOf(accessibleLessons, 1)
    assert.equal(accessibleLessons[0].id, publicLesson.id)
    assert.equal(accessibleLessons[0].title, 'Espaços Vetoriais')
  })
})
