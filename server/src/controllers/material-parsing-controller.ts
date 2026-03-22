import LlamaCloud from '@llamaindex/llama-cloud';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';
import { db } from '../db';
import { materialTable, materialChunksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Initialize Pinecone (lazy initialization)
let pinecone: PineconeClient | null = null;

const getPineconeClient = () => {
  if (!pinecone && process.env.PINECONE_API_KEY) {
    pinecone = new PineconeClient({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pinecone;
};

// Initialize OpenAI Embeddings - Using large model for better accuracy
const getEmbeddings = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    dimensions: 1024,
  });
};

/**
 * Helper: Chunk text with overlap, optimized for RAG
 */
function chunkTextWithOverlap(
  text: string,
  chunkSize: number = 800,
  overlapPercentage: number = 25
): string[] {
  const overlap = Math.floor(chunkSize * (overlapPercentage / 100));
  const chunks: string[] = [];

  let startIndex = 0;
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));

    // Move forward by (chunkSize - overlap)
    startIndex += chunkSize - overlap;

    if (endIndex >= text.length) break;
  }

  return chunks;
}

/**
 * Helper: Detect if text contains code
 */
function isCodeContent(text: string): { isCode: boolean; language?: string } {
  // Code patterns
  const codePatterns = [
    /^(import|from|include|using|package)\s+/m,
    /\bfunction\s+\w+\s*\(/,
    /\bclass\s+\w+/,
    /\bdef\s+\w+\s*\(/,
    /\bpublic\s+(class|interface|static)/,
    /^\s*(const|let|var)\s+\w+\s*=/m,
    /\w+\s*\(\s*\)\s*{/,
    /\bfor\s*\(/,
    /\bwhile\s*\(/,
    /\bif\s*\(/,
  ];

  const hasCodePattern = codePatterns.some((pattern) => pattern.test(text));

  // Language detection
  let language: string | undefined;
  if (hasCodePattern) {
    if (/(import|from)\s+\w+/.test(text) && /def\s+/.test(text))
      language = 'python';
    else if (/(const|let|var|function)/.test(text)) language = 'javascript';
    else if (/(public|private|class)\s+/.test(text) && /;$/.test(text.trim()))
      language = 'java';
    else if (/#include/.test(text)) language = 'cpp';
    else language = 'code';
  }

  return { isCode: hasCodePattern, language };
}

/**
 * Internal function: Parse material content (called directly from material creation)
 * @param materialId - Material ID to parse
 * @param fileUrl - URL of the file to parse
 */
export const parseMaterialContentInternal = async (
  materialId: string,
  fileUrl: string
): Promise<{
  success: boolean;
  chunks_stored: number;
  vectors_stored: number;
  error?: string;
}> => {
  try {
    console.log('📥 Starting material parsing for:', materialId);

    // Validate LlamaCloud API key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      throw new Error('LlamaCloud API key not configured');
    }

    // Fetch material from database
    const [material] = await db
      .select()
      .from(materialTable)
      .where(eq(materialTable.materialId, materialId))
      .limit(1);

    if (!material) {
      throw new Error('Material not found');
    }

    // Update status to processing
    await db
      .update(materialTable)
      .set({ parsingStatus: 'processing' })
      .where(eq(materialTable.materialId, materialId));

    console.log('📥 Downloading file from URL:', fileUrl);

    // Download file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to download file from URL');
    }

    // Get file extension from material name or URL
    const fileExtension = material.name
      ? path.extname(material.name)
      : path.extname(new URL(fileUrl).pathname) || '.pdf';

    // Create temporary file with proper extension
    const tempDir = '/tmp';
    const tempFileName = `${materialId}-${Date.now()}${fileExtension}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Save file to temp location
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(tempFilePath, buffer);

    console.log('📄 Processing material:', material.name);
    console.log('📦 File size:', buffer.length, 'bytes');

    // Initialize LlamaCloud client
    const client = new LlamaCloud({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
    });

    console.log('☁️ Uploading to LlamaCloud...');

    // Use stream for upload
    const fileStream = fsSync.createReadStream(tempFilePath);

    // Upload file to LlamaCloud
    const fileObj = await client.files.create({
      file: fileStream,
      purpose: 'parse',
    });

    console.log('🔍 Parsing document with LlamaCloud...');

    // Parse the document
    const result = await client.parsing.parse({
      file_id: fileObj.id,
      tier: 'agentic',
      version: 'latest',

      input_options: {},

      output_options: {
        markdown: {
          tables: {
            output_tables_as_markdown: false,
          },
        },
        images_to_save: ['screenshot', 'embedded', 'layout'],
      },

      processing_options: {
        ignore: {
          ignore_diagonal_text: true,
        },
        ocr_parameters: {
          languages: ['en'],
        },
      },

      expand: ['text', 'markdown', 'items', 'images_content_metadata'],
    });

    console.log('✅ Parsing complete!');

    // Extract tables
    const tables: any[] = [];
    const pageData: any[] = [];

    if (result.items?.pages) {
      for (const page of result.items.pages) {
        // Type guard: Only process StructuredResultPage, skip FailedStructuredPage
        if (!('items' in page)) {
          console.warn(`⚠️  Skipping failed page ${page.page_number}`);
          continue;
        }

        const pageInfo = {
          page_number: page.page_number,
          items: [] as any[],
          tables: [] as any[],
        };

        for (const item of page.items) {
          if (item.type === 'table') {
            const tableData = {
              page: page.page_number,
              rows: item.rows?.length || 0,
              columns: Array.isArray(item.rows?.[0]) ? item.rows[0].length : 0,
              bbox: item.bbox,
              content: item.rows || [],
            };
            tables.push(tableData);
            pageInfo.tables.push(tableData);
          }
          pageInfo.items.push(item);
        }
        pageData.push(pageInfo);
      }
    }

    // Extract text and markdown per page
    const textPages =
      result.text?.pages?.map((page: any) => ({
        page_number: page.page_number,
        text: page.text,
      })) || [];

    const markdownPages =
      result.markdown?.pages?.map((page: any) => ({
        page_number: page.page_number,
        markdown: page.markdown,
      })) || [];

    // Create unified chunks for both DB and Pinecone
    console.log('✂️  Creating intelligent chunks with 25% overlap...');

    const chunksForDB: any[] = [];
    const documentsForPinecone: Document[] = [];
    let chunkOrderCounter = 0;

    // Process each page
    for (let i = 0; i < textPages.length; i++) {
      const textPage = textPages[i];
      const pageInfo = pageData.find(
        (p) => p.page_number === textPage.page_number
      );

      if (!textPage.text || textPage.text.trim().length === 0) continue;

      // Detect if this page contains code
      const codeAnalysis = isCodeContent(textPage.text);

      // Split page text into smaller chunks with overlap
      const pageChunks = chunkTextWithOverlap(textPage.text, 800, 25);

      for (let chunkIdx = 0; chunkIdx < pageChunks.length; chunkIdx++) {
        const chunkText = pageChunks[chunkIdx];

        // Enhanced context header for better retrieval
        const contextHeader = `[${material.name} - ${material.type.toUpperCase()} - Page ${textPage.page_number}]\n`;
        const fullChunkText = contextHeader + chunkText;

        // Prepare rich metadata
        const chunkMetadata = {
          material_name: material.name,
          material_type: material.type,
          page_number: textPage.page_number,
          chunk_index: chunkIdx,
          total_page_chunks: pageChunks.length,
          has_tables: pageInfo?.tables?.length > 0 || false,
          is_code: codeAnalysis.isCode,
          language: codeAnalysis.language,
          created_at: new Date().toISOString(),
        };

        // Store in DB
        chunksForDB.push({
          materialId: materialId,
          chunkText: chunkText,
          chunkOrder: chunkOrderCounter++,
          chunkType: codeAnalysis.isCode ? 'code' : 'text',
          pageNumber: textPage.page_number,
          language: codeAnalysis.language,
          isCode: codeAnalysis.isCode,
          chunkMetadata: chunkMetadata,
        });

        // Store in Pinecone with rich metadata
        documentsForPinecone.push(
          new Document({
            pageContent: fullChunkText,
            metadata: {
              material_id: materialId,
              course_id: material.courseId,
              ...chunkMetadata,
            },
          })
        );
      }

      // Handle tables separately
      if (pageInfo?.tables) {
        for (const table of pageInfo.tables) {
          const tableText =
            `[TABLE - ${material.name} - Page ${textPage.page_number}]\n` +
            `Rows: ${table.rows}, Columns: ${table.columns}\n` +
            JSON.stringify(table.content, null, 2);

          const tableMetadata = {
            material_name: material.name,
            material_type: material.type,
            page_number: textPage.page_number,
            chunk_type: 'table',
            table_rows: table.rows,
            table_columns: table.columns,
            created_at: new Date().toISOString(),
          };

          chunksForDB.push({
            materialId: materialId,
            chunkText: JSON.stringify(table.content),
            chunkOrder: chunkOrderCounter++,
            chunkType: 'table',
            pageNumber: textPage.page_number,
            isCode: false,
            chunkMetadata: tableMetadata,
          });

          documentsForPinecone.push(
            new Document({
              pageContent: tableText,
              metadata: {
                material_id: materialId,
                course_id: material.courseId,
                ...tableMetadata,
              },
            })
          );
        }
      }
    }

    // Store chunks in database
    console.log('💾 Storing chunks in database...');

    const insertedChunks = await db
      .insert(materialChunksTable)
      .values(chunksForDB)
      .returning();

    console.log(`✅ Stored ${insertedChunks.length} chunks in DB`);

    // Generate embeddings and store in Pinecone
    let pineconeVectorsStored = 0;

    const embeddings = getEmbeddings();
    const pineconeClient = getPineconeClient();

    if (embeddings && pineconeClient && process.env.PINECONE_INDEX) {
      try {
        console.log('☁️  Storing embeddings in Pinecone...');

        // Get Pinecone index
        const pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX!);

        // Store in Pinecone with embeddings
        await PineconeStore.fromDocuments(documentsForPinecone, embeddings, {
          pineconeIndex,
          namespace: `course_${material.courseId}`,
        });

        pineconeVectorsStored = documentsForPinecone.length;

        console.log(`✅ Stored ${pineconeVectorsStored} vectors in Pinecone`);

        // Update material indexing status
        await db
          .update(materialTable)
          .set({
            isIndexed: true,
            indexedAt: new Date(),
            vectorCount: pineconeVectorsStored,
            chunkCount: insertedChunks.length,
            parsingStatus: 'completed',
            parsingError: null,
          })
          .where(eq(materialTable.materialId, materialId));
      } catch (embeddingError: any) {
        console.error(
          '⚠️  Error generating embeddings:',
          embeddingError.message
        );

        // Update with partial success
        await db
          .update(materialTable)
          .set({
            isIndexed: false,
            chunkCount: insertedChunks.length,
            parsingStatus: 'completed',
            parsingError: `Chunks stored but embeddings failed: ${embeddingError.message}`,
          })
          .where(eq(materialTable.materialId, materialId));
      }
    } else {
      console.log(
        '⚠️  Skipping embeddings: OpenAI or Pinecone not configured'
      );

      // Update with chunks only
      await db
        .update(materialTable)
        .set({
          isIndexed: false,
          chunkCount: insertedChunks.length,
          parsingStatus: 'completed',
          parsingError: null,
        })
        .where(eq(materialTable.materialId, materialId));
    }

    // Clean up temporary file
    await fs.unlink(tempFilePath);

    return {
      success: true,
      chunks_stored: insertedChunks.length,
      vectors_stored: pineconeVectorsStored,
    };
  } catch (error: any) {
    console.error('❌ Error parsing document:', error);

    // Update material with error status
    try {
      await db
        .update(materialTable)
        .set({
          parsingStatus: 'failed',
          parsingError: error.message,
        })
        .where(eq(materialTable.materialId, materialId));
    } catch (updateError) {
      console.error('Error updating material status:', updateError);
    }

    return {
      success: false,
      chunks_stored: 0,
      vectors_stored: 0,
      error: error.message,
    };
  }
};

/**
 * Parse material from URL and prepare for RAG system
 * @route POST /api/materials/parse/:materialId
 */
export const parseMaterialContent = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const materialId = Array.isArray(req.params.materialId) 
        ? req.params.materialId[0] 
        : req.params.materialId;

      // Validate required fields
      if (!materialId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Material ID is required'));
      }

      // Fetch material to get URL
      const [material] = await db
        .select()
        .from(materialTable)
        .where(eq(materialTable.materialId, materialId))
        .limit(1);

      if (!material) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Material not found'));
      }

      // Call internal parsing function
      const result = await parseMaterialContentInternal(materialId, material.url);

      if (result.success) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              material_id: materialId,
              chunks_stored: result.chunks_stored,
              pinecone_vectors_stored: result.vectors_stored,
              indexed: result.vectors_stored > 0,
            },
            result.vectors_stored > 0
              ? 'Document parsed, chunked, embedded, and stored successfully'
              : 'Document parsed and chunks stored successfully (embeddings skipped)'
          )
        );
      } else {
        return res.status(500).json(
          new ApiResponse(500, { error: result.error }, 'Failed to parse document')
        );
      }
    } catch (error: any) {
      console.error('❌ Error in parsing endpoint:', error);
      return res.status(500).json(
        new ApiResponse(500, { error: error.message }, 'Failed to parse document')
      );
    }
  }
);

/**
 * Get parsing status for a material
 * @route GET /api/materials/parse/:materialId/status
 */
export const getParsingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const materialId = Array.isArray(req.params.materialId) 
        ? req.params.materialId[0] 
        : req.params.materialId;

      const [material] = await db
        .select({
          materialId: materialTable.materialId,
          name: materialTable.name,
          parsingStatus: materialTable.parsingStatus,
          parsingError: materialTable.parsingError,
          isIndexed: materialTable.isIndexed,
          indexedAt: materialTable.indexedAt,
          vectorCount: materialTable.vectorCount,
          chunkCount: materialTable.chunkCount,
        })
        .from(materialTable)
        .where(eq(materialTable.materialId, materialId))
        .limit(1);

      if (!material) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Material not found'));
      }

      return res.status(200).json(
        new ApiResponse(200, material, 'Parsing status retrieved successfully')
      );
    } catch (error: any) {
      console.error('Error getting parsing status:', error);
      return res.status(500).json(
        new ApiResponse(500, { error: error.message }, 'Failed to get parsing status')
      );
    }
  }
);
