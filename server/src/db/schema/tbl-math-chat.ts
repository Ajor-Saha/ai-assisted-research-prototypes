import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { userTable } from './tbl-user';

export const mathChatTable = pgTable('tbl_math_chat', {
  mathChatId: text('math_chat_id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull().default('New Math Chat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});
