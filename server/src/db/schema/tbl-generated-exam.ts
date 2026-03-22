import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { courseTable } from './tbl-course';
import { examPatternTable } from './tbl-exam-pattern';

export const generatedExamTable = pgTable('tbl_generated_exam', {
  generatedExamId: text('generated_exam_id').notNull().primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courseTable.courseId, { onDelete: 'cascade' }),
  examPatternId: text('exam_pattern_id')
    .notNull()
    .references(() => examPatternTable.examPatternId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  paper: jsonb('paper').notNull(),
  aiModel: varchar('ai_model', { length: 100 }),
  aiPromptHash: varchar('ai_prompt_hash', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
