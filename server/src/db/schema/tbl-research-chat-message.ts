import { pgTable, text, timestamp, varchar, jsonb } from 'drizzle-orm/pg-core';
import { researchChatTable } from './tbl-research-chat';

export const researchChatMessageTable = pgTable('tbl_research_chat_message', {
  messageId: text('message_id').notNull().primaryKey(),
  researchChatId: text('research_chat_id')
    .notNull()
    .references(() => researchChatTable.researchChatId, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  paperReferences: jsonb('paper_references'), // Array of referenced papers
  metadata: jsonb('metadata'), // Store any additional metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
