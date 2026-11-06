import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lessons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('study_track_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('study_tracks')
        .onDelete('CASCADE')
      table.string('title', 150).notNullable()
      table.string('youtube_url', 500).notNullable()
      table.string('youtube_video_id', 32).notNullable()
      table.integer('position').unsigned().notNullable().defaultTo(1)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
