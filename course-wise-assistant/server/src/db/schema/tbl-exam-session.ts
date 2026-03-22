import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { generatedExamTable } from './tbl-generated-exam';
import { userTable } from './tbl-user';

export const examSessionTable = pgTable('tbl_exam_session', {
  examSessionId: text('exam_session_id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  generatedExamId: text('generated_exam_id')
    .notNull()
    .references(() => generatedExamTable.generatedExamId, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('in_progress').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  expiresAt: timestamp('expires_at').notNull(),
  selectedQuestions: jsonb('selected_questions'),
  answers: jsonb('answers').notNull().default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
