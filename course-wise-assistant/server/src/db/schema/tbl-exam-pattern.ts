import { sql } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const examPatternTable = pgTable('tbl_exam_pattern', {
  examPatternId: text('exam_pattern_id').notNull().primaryKey(),
  patternCode: varchar('pattern_code', { length: 50 }).notNull().unique(), // 'final', 'midterm', 'mcq', 'mixed'
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  defaultMarks: integer('default_marks').notNull(),
  defaultTimeMinutes: integer('default_time_minutes'),
  allowCustomMarks: boolean('allow_custom_marks').default(true),
  allowCustomTime: boolean('allow_custom_time').default(true),
  hasSections: boolean('has_sections').default(false),
  hasMCQ: boolean('has_mcq').default(false),
  hasBroadQuestions: boolean('has_broad_questions').default(true),
  hasShortQuestions: boolean('has_short_questions').default(false),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
