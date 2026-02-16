import { pgTable, varchar, timestamp, uuid, integer, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { materialTable } from "./tbl-material";

// Material Chunks Table - stores parsed and chunked content
export const materialChunksTable = pgTable("tbl_material_chunks", {
  chunkId: uuid("chunk_id").primaryKey().defaultRandom(),
  materialId: text("material_id")
    .references(() => materialTable.materialId, { onDelete: 'cascade' })
    .notNull(),
  
  // Chunk content
  chunkText: text("chunk_text").notNull(),
  chunkOrder: integer("chunk_order").notNull(),
  chunkType: varchar("chunk_type", { length: 50 }), // 'text', 'code', 'table', 'equation', etc.
  
  // Context metadata
  pageNumber: integer("page_number"),
  lineStart: integer("line_start"),
  lineEnd: integer("line_end"),
  
  // For code chunks
  language: varchar("language", { length: 50 }),
  isCode: boolean("is_code").default(false),
  
  // Rich metadata for better retrieval
  chunkMetadata: jsonb("chunk_metadata"), // Store headers, context, etc.
  vectorId: varchar("vector_id", { length: 255 }), // Pinecone vector ID for tracking
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type MaterialChunk = typeof materialChunksTable.$inferSelect;
export type NewMaterialChunk = typeof materialChunksTable.$inferInsert;

// NOTE: Chunk Embeddings Table commented out - requires pgvector extension
// To enable: Run this SQL in your Neon database console:
// CREATE EXTENSION IF NOT EXISTS vector;
// 
// Then uncomment the code below:

/*
import { customType } from "drizzle-orm/pg-core";

// Custom vector type for pgvector extension
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1024)';
  },
});

export const chunkEmbeddingsTable = pgTable("tbl_chunk_embeddings", {
  embeddingId: uuid("embedding_id").primaryKey().defaultRandom(),
  chunkId: uuid("chunk_id")
    .references(() => materialChunksTable.chunkId, { onDelete: 'cascade' })
    .notNull(),
  embedding: vector("embedding"), // OpenAI text-embedding-3-large (1024 dimensions)
  model: varchar("model", { length: 100 }).default('text-embedding-3-large'),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChunkEmbedding = typeof chunkEmbeddingsTable.$inferSelect;
export type NewChunkEmbedding = typeof chunkEmbeddingsTable.$inferInsert;
*/
