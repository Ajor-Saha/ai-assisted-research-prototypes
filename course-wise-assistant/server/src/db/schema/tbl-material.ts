import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, varchar, boolean, integer } from 'drizzle-orm/pg-core';
import { courseTable } from './tbl-course';
import { topicTable } from './tbl-topic';

export const materialTable = pgTable('tbl_material', {
  materialId: text('material_id').notNull().primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courseTable.courseId, { onDelete: 'cascade' }),
  topicId: text('topic_id').references(() => topicTable.topicId, {
    onDelete: 'set null',
  }), // Optional - material can exist without topic
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // pdf, video, link, document, etc.
  url: text('url').notNull(), // File URL or link
  fileSize: text('file_size'), // For uploaded files
  
  // Parsing and indexing status
  isIndexed: boolean('is_indexed').default(false),
  indexedAt: timestamp('indexed_at'),
  vectorCount: integer('vector_count').default(0),
  chunkCount: integer('chunk_count').default(0),
  parsingStatus: varchar('parsing_status', { length: 50 }).default('pending'), // 'pending', 'processing', 'completed', 'failed'
  parsingError: text('parsing_error'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
