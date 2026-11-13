import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * AdminMiddleware protects administrative routes, ensuring only
 * users with role === 'admin' can access them.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user || !user.isAdmin) {
      ctx.session.flash(
        'error',
        'Acesso negado. Apenas administradores podem acessar o painel administrativo.'
      )
      return ctx.response.redirect().toRoute('tracks.index')
    }

    return next()
  }
}
