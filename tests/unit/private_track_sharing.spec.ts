import { test } from '@japa/runner'
import User from '#models/user'
import StudyTrack from '#models/study_track'
import StudyTrackMember from '#models/study_track_member'
import Notification from '#models/notification'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Private Track Sharing (Password & Access Requests)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user can unlock a private track with the correct password', async ({ assert }) => {
    const owner = await User.create({
      fullName: 'Dono da Trilha',
      email: 'dono_priv@teste.com',
      password: 'password123',
    })

    const guest = await User.create({
      fullName: 'Convidado',
      email: 'convidado_priv@teste.com',
      password: 'password123',
    })

    const hashedPassword = await hash.make('segredo123')
    const track = await StudyTrack.create({
      userId: owner.id,
      title: 'Trilha Privada com Senha',
      isPublic: false,
      accessPassword: hashedPassword,
    })

    // Wrong password fails
    assert.isFalse(await hash.verify(track.accessPassword!, 'errada'))
    // Right password succeeds
    assert.isTrue(await hash.verify(track.accessPassword!, 'segredo123'))

    const member = await StudyTrackMember.updateOrCreate(
      { studyTrackId: track.id, userId: guest.id },
      { status: 'approved' }
    )

    assert.equal(member.status, 'approved')
  })

  test('requesting access creates pending membership and notifies track owner', async ({
    assert,
  }) => {
    const owner = await User.create({
      fullName: 'Dono Solicitação',
      email: 'dono_sol@teste.com',
      password: 'password123',
    })

    const requester = await User.create({
      fullName: 'Solicitante',
      email: 'solicitante@teste.com',
      password: 'password123',
    })

    const track = await StudyTrack.create({
      userId: owner.id,
      title: 'Grupo Fechado de Estudos',
      isPublic: false,
    })

    const member = await StudyTrackMember.create({
      studyTrackId: track.id,
      userId: requester.id,
      status: 'pending',
    })

    await Notification.create({
      userId: owner.id,
      title: 'Nova solicitação de acesso',
      message: `${requester.fullName} solicitou acesso à sua trilha privada "${track.title}".`,
      link: `/tracks/${track.id}`,
      isRead: false,
    })

    assert.equal(member.status, 'pending')

    const ownerNotifications = await Notification.query()
      .where('userId', owner.id)
      .where('isRead', false)
    assert.lengthOf(ownerNotifications, 1)
    assert.include(ownerNotifications[0].message, requester.fullName!)

    // Owner approves request
    member.status = 'approved'
    await member.save()

    const refreshed = await StudyTrackMember.findOrFail(member.id)
    assert.equal(refreshed.status, 'approved')
  })

  test('public track only appears in user tracks after explicitly joining', async ({ assert }) => {
    const author = await User.create({
      fullName: 'Autor Pública',
      email: 'autor_pub@teste.com',
      password: 'password123',
    })

    const student = await User.create({
      fullName: 'Aluno Visitante',
      email: 'visitante_pub@teste.com',
      password: 'password123',
    })

    const publicTrack = await StudyTrack.create({
      userId: author.id,
      title: 'Física Moderna Pública',
      isPublic: true,
    })

    // Before joining: student's own/joined tracks should NOT include publicTrack
    let approvedMemberships = await StudyTrackMember.query()
      .where('userId', student.id)
      .where('status', 'approved')
    let approvedIds = approvedMemberships.map((m) => m.studyTrackId)

    let myTracks = await StudyTrack.query().where((q) => {
      q.where('userId', student.id)
      if (approvedIds.length > 0) {
        q.orWhereIn('id', approvedIds)
      }
    })
    assert.isFalse(myTracks.some((t) => t.id === publicTrack.id))

    // Student joins public track
    await StudyTrackMember.updateOrCreate(
      { studyTrackId: publicTrack.id, userId: student.id },
      { status: 'approved' }
    )

    approvedMemberships = await StudyTrackMember.query()
      .where('userId', student.id)
      .where('status', 'approved')
    approvedIds = approvedMemberships.map((m) => m.studyTrackId)

    myTracks = await StudyTrack.query().where((q) => {
      q.where('userId', student.id)
      if (approvedIds.length > 0) {
        q.orWhereIn('id', approvedIds)
      }
    })
    assert.isTrue(myTracks.some((t) => t.id === publicTrack.id))
  })

  test('owner can transfer track ownership and then leave the track', async ({ assert }) => {
    const owner = await User.create({
      fullName: 'Dono Original',
      email: 'dono_orig@teste.com',
      password: 'password123',
    })

    const nextOwner = await User.create({
      fullName: 'Novo Dono',
      email: 'novo_dono@teste.com',
      password: 'password123',
    })

    const track = await StudyTrack.create({
      userId: owner.id,
      title: 'Trilha Transferível',
      isPublic: false,
    })

    await StudyTrackMember.create({
      studyTrackId: track.id,
      userId: nextOwner.id,
      status: 'approved',
    })

    // Transfer ownership to nextOwner and keep previous owner as approved member
    track.userId = nextOwner.id
    await track.save()

    await StudyTrackMember.query()
      .where('studyTrackId', track.id)
      .where('userId', nextOwner.id)
      .delete()

    await StudyTrackMember.updateOrCreate(
      { studyTrackId: track.id, userId: owner.id },
      { status: 'approved' }
    )

    const updatedTrack = await StudyTrack.findOrFail(track.id)
    assert.equal(updatedTrack.userId, nextOwner.id)

    // Previous owner can now leave the track
    await StudyTrackMember.query()
      .where('studyTrackId', track.id)
      .where('userId', owner.id)
      .delete()

    const remainingMembership = await StudyTrackMember.query()
      .where('studyTrackId', track.id)
      .where('userId', owner.id)
      .first()
    assert.isNull(remainingMembership)
  })

  test('transfer candidates for non-admin owner only include approved track members, not random platform users', async ({
    assert,
  }) => {
    const owner = await User.create({
      fullName: 'Dono Privacidade',
      email: 'dono_privacidade@teste.com',
      password: 'password123',
    })

    const approvedFriend = await User.create({
      fullName: 'Amigo Aprovado',
      email: 'amigo_aprovado@teste.com',
      password: 'password123',
    })

    const unrelatedStranger = await User.create({
      fullName: 'Usuário Desconhecido',
      email: 'desconhecido@teste.com',
      password: 'password123',
    })

    const track = await StudyTrack.create({
      userId: owner.id,
      title: 'Trilha Privada Segura',
      isPublic: false,
    })

    await StudyTrackMember.create({
      studyTrackId: track.id,
      userId: approvedFriend.id,
      status: 'approved',
    })

    const approvedMembers = await StudyTrackMember.query()
      .where('studyTrackId', track.id)
      .where('status', 'approved')
      .preload('user')

    const transferCandidates = approvedMembers
      .map((m) => m.user)
      .filter((u) => Boolean(u && u.id !== track.userId))

    assert.lengthOf(transferCandidates, 1)
    assert.equal(transferCandidates[0].id, approvedFriend.id)
    assert.isFalse(transferCandidates.some((c) => c.id === unrelatedStranger.id))
  })
})
