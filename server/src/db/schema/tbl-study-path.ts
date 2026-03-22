import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { courseTable } from './tbl-course';
import { userTable } from './tbl-user';

export const studyPathTable = pgTable('tbl_study_path', {
  studyPathId: text('study_path_id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  courseId: text('course_id')
    .notNull()
    .references(() => courseTable.courseId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  summary: text('summary').notNull(),
  examDate: timestamp('exam_date'),
  aiModel: varchar('ai_model', { length: 120 }).default('gemini-2.5-flash'),
  tasks: jsonb('tasks').notNull(),
  insights: jsonb('insights').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
