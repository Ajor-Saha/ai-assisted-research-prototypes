import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { chatTable } from './tbl-chat';

export const chatMessageTable = pgTable('tbl_chat_message', {
  messageId: text('message_id').notNull().primaryKey(),
  chatId: text('chat_id')
    .notNull()
    .references(() => chatTable.chatId, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  attachments: jsonb('attachments'), // Array of file attachments {name, url, type, size}
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
