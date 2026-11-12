import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin@grupodeestudo.com' },
      {
        fullName: 'Professor Administrador',
        email: 'admin@grupodeestudo.com',
        password: 'admin12345',
        role: 'admin',
      }
    )
  }
}
