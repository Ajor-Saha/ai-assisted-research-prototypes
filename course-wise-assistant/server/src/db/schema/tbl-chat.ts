import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { courseTable } from './tbl-course';
import { userTable } from './tbl-user';

export const chatTable = pgTable('tbl_chat', {
  chatId: text('chat_id').notNull().primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courseTable.courseId, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull().default('New Chat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
