import { test } from '@japa/runner'
import User from '#models/user'
import StudyTrack from '#models/study_track'
import Lesson from '#models/lesson'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('BackOffice Administration', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user role identification and admin privileges', async ({ assert }) => {
    const admin = await User.create({
      fullName: 'Admin Teste',
      email: 'adm@teste.com',
      password: 'password123',
      role: 'admin',
    })

    const student = await User.create({
      fullName: 'Aluno Normal',
      email: 'aluno_bo@teste.com',
      password: 'password123',
      role: 'student',
    })

    assert.isTrue(admin.isAdmin)
    assert.isFalse(student.isAdmin)
  })

  test('toggle role switches between student and admin correctly', async ({ assert }) => {
    const student = await User.create({
      fullName: 'Aluno Promovido',
      email: 'promovido@teste.com',
      password: 'password123',
      role: 'student',
    })

    assert.isFalse(student.isAdmin)

    // Promote to admin
    student.role = 'admin'
    await student.save()
    assert.isTrue(student.isAdmin)

    // Demote back to student
    student.role = 'student'
    await student.save()
    assert.isFalse(student.isAdmin)
  })

  test('admin can moderate and delete any lesson across tracks', async ({ assert }) => {
    const student = await User.create({
      fullName: 'Aluno Criador',
      email: 'criador@teste.com',
      password: 'password123',
    })

    const track = await StudyTrack.create({
      userId: student.id,
      title: 'Trilha do Aluno',
      isPublic: false,
    })

    const lesson = await Lesson.create({
      studyTrackId: track.id,
      title: 'Vídeo Indevido',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: 'dQw4w9WgXcQ',
      position: 1,
    })

    // Delete lesson directly
    await lesson.delete()

    const found = await Lesson.find(lesson.id)
    assert.isNull(found)
  })
})
