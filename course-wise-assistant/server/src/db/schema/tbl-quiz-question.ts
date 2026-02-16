import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { quizTable } from './tbl-quiz';

export const quizQuestionTable = pgTable('tbl_quiz_question', {
  questionId: text('question_id').notNull().primaryKey(),
  quizId: text('quiz_id')
    .notNull()
    .references(() => quizTable.quizId, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  questionType: varchar('question_type', { length: 50 }).notNull(), // mcq, true-false, multiple-select
  options: jsonb('options').notNull(), // Array of options [{id, text}]
  correctAnswer: jsonb('correct_answer').notNull(), // Single answer or array for multiple select
  explanation: text('explanation'), // Explanation for the correct answer
  points: integer('points').default(1),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
