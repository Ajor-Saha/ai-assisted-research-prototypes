import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { courseTable } from './tbl-course';

export const shortQATable = pgTable('tbl_short_qa', {
  qaId: text('qa_id').notNull().primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courseTable.courseId, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: varchar('category', { length: 100 }), // Optional categorization
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
