import { sql } from 'drizzle-orm';
import { jsonb, numeric, pgTable, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';
import { examSessionTable } from './tbl-exam-session';
import { userTable } from './tbl-user';

export const examResultTable = pgTable('tbl_exam_result', {
  examResultId: text('exam_result_id').notNull().primaryKey(),
  examSessionId: text('exam_session_id')
    .notNull()
    .references(() => examSessionTable.examSessionId, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  totalMarks: integer('total_marks').notNull(),
  obtainedMarks: numeric('obtained_marks', { precision: 6, scale: 2 }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  grade: varchar('grade', { length: 5 }),
  evaluation: jsonb('evaluation').notNull(),
  aiFeedback: text('ai_feedback'),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
