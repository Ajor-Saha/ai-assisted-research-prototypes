import { pgTable, text, timestamp, varchar, jsonb } from 'drizzle-orm/pg-core';
import { mathChatTable } from './tbl-math-chat';

export const mathChatMessageTable = pgTable('tbl_math_chat_message', {
  messageId: text('message_id').notNull().primaryKey(),
  mathChatId: text('math_chat_id')
    .notNull()
    .references(() => mathChatTable.mathChatId, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  attachments: jsonb('attachments'), // Array of file attachments {name, url, type, size, fileId}
  metadata: jsonb('metadata'), // Store problem type, steps, visualizations, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
