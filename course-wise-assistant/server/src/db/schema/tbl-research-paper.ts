import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, varchar, boolean, integer } from 'drizzle-orm/pg-core';
import { userTable } from './tbl-user';

export const researchPaperTable = pgTable('tbl_research_paper', {
  paperId: text('paper_id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.userId, { onDelete: 'cascade' }),
  
  // Paper metadata
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  authors: text('authors'), // Comma-separated or JSON
  publicationDate: varchar('publication_date', { length: 100 }),
  source: varchar('source', { length: 255 }), // Journal, Conference, etc.
  
  // File information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // pdf, doc, docx, txt
  fileUrl: text('file_url').notNull(), // R2 bucket URL
  fileSize: text('file_size'), // File size in bytes
  
  // Parsing and indexing status
  isIndexed: boolean('is_indexed').default(false),
  indexedAt: timestamp('indexed_at'),
  vectorCount: integer('vector_count').default(0),
  chunkCount: integer('chunk_count').default(0),
  parsingStatus: varchar('parsing_status', { length: 50 }).default('pending'), // 'pending', 'processing', 'completed', 'failed'
  parsingError: text('parsing_error'),
  
  // Categorization
  category: varchar('category', { length: 100 }), // AI, ML, Computer Science, etc.
  tags: text('tags'), // JSON array of tags
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

// Type exports
export type ResearchPaper = typeof researchPaperTable.$inferSelect;
export type NewResearchPaper = typeof researchPaperTable.$inferInsert;
