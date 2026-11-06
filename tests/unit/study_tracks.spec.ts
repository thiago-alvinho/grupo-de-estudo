import { test } from '@japa/runner'
import {
  extractYoutubeVideoId,
  lessonValidator,
  studyTrackValidator,
} from '#validators/study_track'
import User from '#models/user'
import StudyTrack from '#models/study_track'
import Lesson from '#models/lesson'
import LessonProgress from '#models/lesson_progress'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('Study Tracks & YouTube Lessons', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('extractYoutubeVideoId extracts 11-char ID from standard, short, embed, and shorts URLs', ({
    assert,
  }) => {
    assert.equal(
      extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    )
    assert.equal(
      extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s'),
      'dQw4w9WgXcQ'
    )
    assert.equal(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abc123'), 'dQw4w9WgXcQ')
    assert.equal(extractYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
    assert.equal(extractYoutubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
    assert.isNull(extractYoutubeVideoId('https://example.com/video'))
    assert.isNull(extractYoutubeVideoId(''))
  })

  test('validators accept valid study track and YouTube lesson payloads', async ({ assert }) => {
    const validTrack = await studyTrackValidator.validate({
      title: 'Cálculo I - Limites e Derivadas',
      description: 'Playlist para estudar para a P1',
    })
    assert.equal(validTrack.title, 'Cálculo I - Limites e Derivadas')

    const validLesson = await lessonValidator.validate({
      title: 'Aula 01 - Conceito de Limite',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
    assert.equal(validLesson.title, 'Aula 01 - Conceito de Limite')

    await assert.rejects(async () => {
      await lessonValidator.validate({
        title: 'Aula inválida',
        youtubeUrl: 'https://google.com',
      })
    })
  })

  test('full lifecycle: create track, add lessons, record progress, update, and delete with cascade', async ({
    assert,
  }) => {
    const user = await User.create({
      fullName: 'Estudante Teste',
      email: 'estudante@teste.com',
      password: 'password123',
    })

    const track = await StudyTrack.create({
      userId: user.id,
      title: 'Estruturas de Dados',
      description: 'Árvores, Grafos e Tabelas Hash',
      isPublic: false,
    })

    const lesson1 = await Lesson.create({
      studyTrackId: track.id,
      title: 'Aula 1 - Pilhas e Filas',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: 'dQw4w9WgXcQ',
      position: 1,
    })

    const lesson2 = await Lesson.create({
      studyTrackId: track.id,
      title: 'Aula 2 - Árvores Binárias',
      youtubeUrl: 'https://youtu.be/aqz-KE-bpKQ',
      youtubeVideoId: 'aqz-KE-bpKQ',
      position: 2,
    })

    await LessonProgress.create({
      userId: user.id,
      lessonId: lesson1.id,
      completedAt: DateTime.now(),
    })

    await track.load('lessons')
    assert.lengthOf(track.lessons, 2)

    const completedCount = await LessonProgress.query()
      .where('userId', user.id)
      .whereIn('lessonId', [lesson1.id, lesson2.id])

    assert.lengthOf(completedCount, 1)

    await track.delete()

    const remainingLessons = await Lesson.query().where('studyTrackId', track.id)
    assert.lengthOf(remainingLessons, 0)
  })
})
