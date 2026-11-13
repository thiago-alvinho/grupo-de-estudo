import StudyTrack from '#models/study_track'
import StudyTrackMember from '#models/study_track_member'
import Notification from '#models/notification'
import User from '#models/user'
import realtimeService from '#services/realtime_service'
import hash from '@adonisjs/core/services/hash'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * TrackAccessController manages password unlocking, access requests,
 * and owner approvals/rejections for shared private study tracks.
 */
export default class TrackAccessController {
  /**
   * Join a public study track so it appears in the user's "Minhas Trilhas".
   */
  async joinPublic({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.findOrFail(params.id)

    if (!track.isPublic) {
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    if (track.userId !== user.id) {
      await StudyTrackMember.updateOrCreate(
        { studyTrackId: track.id, userId: user.id },
        { status: 'approved' }
      )
      session.flash(
        'success',
        `Você entrou na trilha "${track.title}"! Ela foi adicionada em Minhas Trilhas.`
      )
    }

    return response.redirect().toRoute('tracks.show', { id: track.id })
  }

  /**
   * Attempt to unlock a private study track using its access password.
   */
  async unlockWithPassword({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.findOrFail(params.id)
    const password = String(request.input('password', '')).trim()

    if (!track.accessPassword) {
      session.flash(
        'error',
        'Esta trilha privada não possui senha configurada. Solicite acesso ao dono.'
      )
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    const isValid = await hash.verify(track.accessPassword, password)
    if (!isValid) {
      session.flash('error', 'Senha incorreta. Tente novamente ou solicite acesso ao dono.')
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    await StudyTrackMember.updateOrCreate(
      { studyTrackId: track.id, userId: user.id },
      { status: 'approved' }
    )

    session.flash('success', `Acesso liberado! Bem-vindo à trilha "${track.title}".`)
    return response.redirect().toRoute('tracks.show', { id: track.id })
  }

  /**
   * Request access to a private study track, notifying the owner in real time.
   */
  async requestAccess({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.findOrFail(params.id)

    if (track.userId === user.id || track.isPublic) {
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    const existing = await StudyTrackMember.query()
      .where('studyTrackId', track.id)
      .where('userId', user.id)
      .first()

    if (existing && existing.status === 'approved') {
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    if (existing && existing.status === 'pending') {
      session.flash('success', 'Sua solicitação já foi enviada e aguarda aprovação do dono.')
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    const member = await StudyTrackMember.updateOrCreate(
      { studyTrackId: track.id, userId: user.id },
      { status: 'pending' }
    )

    const requesterName = user.fullName || user.email
    const notifTitle = 'Nova solicitação de acesso'
    const notifMessage = `${requesterName} solicitou acesso à sua trilha privada "${track.title}".`
    const notifLink = `/tracks/${track.id}#access-requests`

    await Notification.create({
      userId: track.userId,
      title: notifTitle,
      message: notifMessage,
      link: notifLink,
      isRead: false,
    })

    const unreadResult = await Notification.query()
      .where('userId', track.userId)
      .where('isRead', false)
      .count('* as total')
    const unreadCount = Number(unreadResult[0]?.$extras.total || 0)

    realtimeService.emitToUser(track.userId, {
      type: 'access_request',
      title: notifTitle,
      message: notifMessage,
      link: notifLink,
      trackId: track.id,
      unreadCount,
      member: {
        id: member.id,
        userName: requesterName,
        userEmail: user.email,
        status: 'pending',
      },
    })

    session.flash('success', 'Solicitação enviada! O dono da trilha foi notificado em tempo real.')
    return response.redirect().toRoute('tracks.show', { id: track.id })
  }

  /**
   * Approve a pending access request (track owner or admin).
   */
  async approve({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.id)
      .where((q) => {
        if (!user.isAdmin) {
          q.where('userId', user.id)
        }
      })
      .firstOrFail()

    const member = await StudyTrackMember.query()
      .where('id', params.memberId)
      .where('studyTrackId', track.id)
      .preload('user')
      .firstOrFail()

    member.status = 'approved'
    await member.save()

    const notifTitle = 'Acesso aprovado!'
    const notifMessage = `Sua solicitação para a trilha privada "${track.title}" foi aprovada.`
    const notifLink = `/tracks/${track.id}`

    await Notification.create({
      userId: member.userId,
      title: notifTitle,
      message: notifMessage,
      link: notifLink,
      isRead: false,
    })

    const unreadResult = await Notification.query()
      .where('userId', member.userId)
      .where('isRead', false)
      .count('* as total')

    realtimeService.emitToUser(member.userId, {
      type: 'access_response',
      title: notifTitle,
      message: notifMessage,
      link: notifLink,
      trackId: track.id,
      unreadCount: Number(unreadResult[0]?.$extras.total || 0),
    })

    session.flash('success', `Acesso aprovado para ${member.user.fullName || member.user.email}.`)
    return response.redirect().toRoute('tracks.show', { id: track.id })
  }

  /**
   * Reject a pending access request (track owner or admin).
   */
  async reject({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.id)
      .where((q) => {
        if (!user.isAdmin) {
          q.where('userId', user.id)
        }
      })
      .firstOrFail()

    const member = await StudyTrackMember.query()
      .where('id', params.memberId)
      .where('studyTrackId', track.id)
      .preload('user')
      .firstOrFail()

    member.status = 'rejected'
    await member.save()

    const notifTitle = 'Solicitação de acesso recusada'
    const notifMessage = `Sua solicitação para a trilha "${track.title}" não foi aprovada pelo autor.`

    await Notification.create({
      userId: member.userId,
      title: notifTitle,
      message: notifMessage,
      link: '/tracks',
      isRead: false,
    })

    const unreadResult = await Notification.query()
      .where('userId', member.userId)
      .where('isRead', false)
      .count('* as total')

    realtimeService.emitToUser(member.userId, {
      type: 'access_response',
      title: notifTitle,
      message: notifMessage,
      link: '/tracks',
      trackId: track.id,
      unreadCount: Number(unreadResult[0]?.$extras.total || 0),
    })

    session.flash(
      'success',
      `Solicitação de ${member.user.fullName || member.user.email} recusada.`
    )
    return response.redirect().toRoute('tracks.show', { id: track.id })
  }

  /**
   * Remove an approved member from the private track (owner or admin).
   */
  async removeMember({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.query()
      .where('id', params.id)
      .where((q) => {
        if (!user.isAdmin) {
          q.where('userId', user.id)
        }
      })
      .firstOrFail()

    const member = await StudyTrackMember.query()
      .where('id', params.memberId)
      .where('studyTrackId', track.id)
      .firstOrFail()

    await member.delete()
    session.flash('success', 'Membro removido da trilha privada.')
    return response.redirect().toRoute('tracks.show', { id: track.id })
  }

  /**
   * Leave a joined track (public or shared private) so it is removed from "Minhas Trilhas".
   * The owner cannot leave directly without transferring ownership or deleting the track.
   */
  async leave({ params, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.findOrFail(params.id)

    if (track.userId === user.id) {
      session.flash(
        'error',
        'Você é o dono desta trilha. Para sair, transfira a posse para outro usuário ou exclua a trilha.'
      )
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    await StudyTrackMember.query().where('studyTrackId', track.id).where('userId', user.id).delete()

    session.flash('success', `Você saiu da trilha "${track.title}".`)
    return response.redirect().toRoute('tracks.index')
  }

  /**
   * Transfer ownership of a study track to another user (owner or admin).
   * Optionally removes the previous owner from the track right away.
   */
  async transferOwnership({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    const track = await StudyTrack.findOrFail(params.id)

    if (track.userId !== user.id && !user.isAdmin) {
      session.flash('error', 'Apenas o dono da trilha pode transferir a posse.')
      return response.redirect().toRoute('tracks.show', { id: track.id })
    }

    const newOwnerId = Number(request.input('newOwnerId'))
    const newOwnerEmail = String(request.input('newOwnerEmail', '')).trim().toLowerCase()
    const leaveInput = request.input('leaveAfterTransfer')
    const leaveAfterTransfer =
      leaveInput === 'true' || leaveInput === 'on' || leaveInput === true || leaveInput === '1'

    let newOwner: User | null = null

    if (newOwnerEmail) {
      newOwner = await User.query().whereRaw('LOWER(email) = ?', [newOwnerEmail]).first()
    } else if (newOwnerId && !Number.isNaN(newOwnerId)) {
      if (!user.isAdmin) {
        const isApprovedMember = await StudyTrackMember.query()
          .where('studyTrackId', track.id)
          .where('userId', newOwnerId)
          .where('status', 'approved')
          .first()

        if (!isApprovedMember) {
          session.flash(
            'error',
            'Você só pode selecionar membros aprovados da trilha ou informar o e-mail exato do destinatário.'
          )
          return response.redirect().back()
        }
      }
      newOwner = await User.find(newOwnerId)
    }

    if (!newOwner || newOwner.id === track.userId) {
      session.flash(
        'error',
        'Informe um membro aprovado ou o e-mail válido de outro usuário cadastrado para receber a posse.'
      )
      return response.redirect().back()
    }

    if (track.isPublic && !newOwner.isAdmin) {
      session.flash(
        'error',
        'Trilhas públicas oficiais só podem ser transferidas para outro administrador.'
      )
      return response.redirect().back()
    }

    const previousOwnerId = track.userId
    track.userId = newOwner.id
    await track.save()

    // New owner no longer needs a member record since they now own the track
    await StudyTrackMember.query()
      .where('studyTrackId', track.id)
      .where('userId', newOwner.id)
      .delete()

    if (leaveAfterTransfer) {
      await StudyTrackMember.query()
        .where('studyTrackId', track.id)
        .where('userId', previousOwnerId)
        .delete()
    } else {
      await StudyTrackMember.updateOrCreate(
        { studyTrackId: track.id, userId: previousOwnerId },
        { status: 'approved' }
      )
    }

    const actorName = user.fullName || user.email
    const notifTitle = 'Posse de trilha transferida para você'
    const notifMessage = `${actorName} transferiu a posse da trilha "${track.title}" para você.`
    const notifLink = `/tracks/${track.id}`

    await Notification.create({
      userId: newOwner.id,
      title: notifTitle,
      message: notifMessage,
      link: notifLink,
      isRead: false,
    })

    const unreadResult = await Notification.query()
      .where('userId', newOwner.id)
      .where('isRead', false)
      .count('* as total')

    realtimeService.emitToUser(newOwner.id, {
      type: 'notification',
      title: notifTitle,
      message: notifMessage,
      link: notifLink,
      trackId: track.id,
      unreadCount: Number(unreadResult[0]?.$extras.total || 0),
    })

    const newOwnerName = newOwner.fullName || newOwner.email

    if (leaveAfterTransfer && previousOwnerId === user.id) {
      session.flash(
        'success',
        `Posse da trilha "${track.title}" transferida para ${newOwnerName} e você saiu da trilha.`
      )
      return response.redirect().toRoute('tracks.index')
    }

    session.flash('success', `Posse da trilha "${track.title}" transferida para ${newOwnerName}!`)
    return response.redirect().toRoute('tracks.show', { id: track.id })
  }
}
