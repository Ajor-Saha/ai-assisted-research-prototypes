import { pgTable, text, timestamp, varchar, jsonb } from 'drizzle-orm/pg-core';
import { mathChatMessageTable } from './tbl-math-chat-message';
import { mathChatTable } from './tbl-math-chat';
import { userTable } from './tbl-user';

export const mathMessageWebSearchTable = pgTable('tbl_math_message_web_search', {
  searchId: text('search_id').notNull().primaryKey(),
  messageId: text('message_id')
    .notNull()
    .references(() => mathChatMessageTable.messageId, { onDelete: 'cascade' }),
  mathChatId: text('math_chat_id')
    .notNull()
    .references(() => mathChatTable.mathChatId, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  searchQuery: varchar('search_query', { length: 512 }).notNull(),
  summary: text('summary').notNull(),
  sources: jsonb('sources').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});