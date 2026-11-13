import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'study_tracks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('access_password', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('access_password')
    })
  }
}
