import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lesson_notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('lesson_id')
        .unsigned()
        .references('id')
        .inTable('lessons')
        .onDelete('CASCADE')
        .notNullable()
      table.text('content').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'lesson_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
