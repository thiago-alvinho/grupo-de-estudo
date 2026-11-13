import { test } from '@japa/runner'
import User from '#models/user'
import StudyTrack from '#models/study_track'
import Lesson from '#models/lesson'
import LessonNote from '#models/lesson_note'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Lesson Notes Persistence', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user can create and update personal notes per lesson in database', async ({ assert }) => {
    const user = await User.create({
      fullName: 'Estudante Notas',
      email: 'notas@teste.com',
      password: 'password123',
    })

    const track = await StudyTrack.create({
      userId: user.id,
      title: 'Cálculo II',
      isPublic: false,
    })

    const lesson = await Lesson.create({
      studyTrackId: track.id,
      title: 'Integrais Duplas',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: 'dQw4w9WgXcQ',
      position: 1,
    })

    // Create note
    await LessonNote.updateOrCreate(
      { userId: user.id, lessonId: lesson.id },
      { content: 'Revisar teorema de Fubini.' }
    )

    let saved = await LessonNote.query()
      .where('userId', user.id)
      .where('lessonId', lesson.id)
      .firstOrFail()
    assert.equal(saved.content, 'Revisar teorema de Fubini.')

    // Update note without duplicating row
    await LessonNote.updateOrCreate(
      { userId: user.id, lessonId: lesson.id },
      { content: 'Revisar teorema de Fubini e coordenadas polares.' }
    )

    const allNotes = await LessonNote.query().where('userId', user.id).where('lessonId', lesson.id)
    assert.lengthOf(allNotes, 1)
    assert.equal(allNotes[0].content, 'Revisar teorema de Fubini e coordenadas polares.')
  })
})
