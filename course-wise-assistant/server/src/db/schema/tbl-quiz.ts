import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { courseTable } from './tbl-course';

export const quizTable = pgTable('tbl_quiz', {
  quizId: text('quiz_id').notNull().primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courseTable.courseId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  timeLimit: integer('time_limit'), // Time limit in minutes (optional)
  passingScore: integer('passing_score').default(70), // Percentage
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
