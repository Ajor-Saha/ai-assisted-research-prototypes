import { pgTable, varchar, timestamp, uuid, integer, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { researchPaperTable } from "./tbl-research-paper";

// Research Paper Chunks Table - stores parsed and chunked content
export const researchPaperChunksTable = pgTable("tbl_research_paper_chunks", {
  chunkId: uuid("chunk_id").primaryKey().defaultRandom(),
  paperId: text("paper_id")
    .references(() => researchPaperTable.paperId, { onDelete: 'cascade' })
    .notNull(),
  
  // Chunk content
  chunkText: text("chunk_text").notNull(),
  chunkOrder: integer("chunk_order").notNull(),
  chunkType: varchar("chunk_type", { length: 50 }), // 'text', 'code', 'table', 'equation', 'citation', etc.
  
  // Context metadata
  pageNumber: integer("page_number"),
  sectionTitle: varchar("section_title", { length: 500 }),
  
  // For code chunks
  language: varchar("language", { length: 50 }),
  isCode: boolean("is_code").default(false),
  
  // For citations and references
  isCitation: boolean("is_citation").default(false),
  isReference: boolean("is_reference").default(false),
  
  // Rich metadata for better retrieval
  chunkMetadata: jsonb("chunk_metadata"), // Store section headers, context, etc.
  vectorId: varchar("vector_id", { length: 255 }), // Pinecone vector ID for tracking
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type ResearchPaperChunk = typeof researchPaperChunksTable.$inferSelect;
export type NewResearchPaperChunk = typeof researchPaperChunksTable.$inferInsert;
