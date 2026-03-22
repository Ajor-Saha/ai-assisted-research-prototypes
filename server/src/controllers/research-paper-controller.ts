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
import { researchPaperTable, researchPaperChunksTable } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 Client for R2
const getR2Client = () => {
  if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY || !process.env.ENDPOINT_URL) {
    return null;
  }
  return new S3Client({
    region: 'auto',
    endpoint: process.env.ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
  });
};

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
 * Helper: Detect if text contains citations
 */
function isCitationContent(text: string): boolean {
  const citationPatterns = [
    /\[\d+\]/,  // [1], [2], etc.
    /\(\w+\s+et\s+al\.,?\s+\d{4}\)/, // (Smith et al., 2020)
    /\(\w+,\s+\d{4}\)/, // (Smith, 2020)
    /et\s+al\./i,
  ];
  
  return citationPatterns.some((pattern) => pattern.test(text));
}

/**
 * Upload research paper and start parsing pipeline
 * @route POST /api/research-papers/upload
 */
export const uploadResearchPaper = asyncHandler(
  async (req: Request & { user?: any; researchFile?: any }, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const file = req.researchFile;
      if (!file) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'No file uploaded'));
      }

      const { title, description, authors, publicationDate, source, category, tags } = req.body;

      // Validate required fields
      if (!title) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Title is required'));
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed'));
      }

      const r2Client = getR2Client();
      if (!r2Client) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, 'R2 storage not configured'));
      }

      // Generate unique paper ID
      const paperId = nanoid();
      
      // Generate R2 key
      const fileExtension = path.extname(file.originalFilename || file.newFilename || '');
      const r2Key = `research-papers/${req.user.userId}/${paperId}${fileExtension}`;

      console.log('📤 Uploading to R2:', r2Key);

      // Read file from disk (formidable saves to temp location)
      const fileBuffer = await fs.readFile(file.filepath);

      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: file.mimetype || 'application/octet-stream',
      });

      await r2Client.send(uploadCommand);

      // Generate public URL
      const fileUrl = `${process.env.PUBLIC_ACCESS_URL}/${r2Key}`;

      console.log('✅ File uploaded to R2:', fileUrl);

      // Clean up temp file
      await fs.unlink(file.filepath).catch(() => {});

      // Create research paper record
      const [newPaper] = await db
        .insert(researchPaperTable)
        .values({
          paperId,
          userId: req.user.userId,
          title,
          description: description || null,
          authors: authors || null,
          publicationDate: publicationDate || null,
          source: source || null,
          fileName: file.originalFilename || file.newFilename || 'unknown',
          fileType: fileExtension.replace('.', ''),
          fileUrl,
          fileSize: file.size.toString(),
          category: category || null,
          tags: tags || null,
          parsingStatus: 'pending',
        })
        .returning();

      console.log('✅ Research paper created:', paperId);

      // Start parsing pipeline asynchronously (don't wait for it)
      parseResearchPaperInternal(paperId, fileUrl).catch((error) => {
        console.error('Error in async parsing pipeline:', error);
      });

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            paper: newPaper,
          },
          'Research paper uploaded successfully. Parsing has started in the background.'
        )
      );
    } catch (error) {
      console.error('❌ Error uploading research paper:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json(
        new ApiResponse(500, { error: errorMessage }, 'Failed to upload research paper')
      );
    }
  }
);

/**
 * Internal function: Parse research paper content
 * @param paperId - Paper ID to parse
 * @param fileUrl - URL of the file to parse
 */
export const parseResearchPaperInternal = async (
  paperId: string,
  fileUrl: string
): Promise<{
  success: boolean;
  chunks_stored: number;
  vectors_stored: number;
  error?: string;
}> => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  try {
    console.log('📥 Starting research paper parsing for:', paperId);

    // Validate LlamaCloud API key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      throw new Error('LlamaCloud API key not configured');
    }

    // Fetch paper from database
    const [paper] = await db
      .select()
      .from(researchPaperTable)
      .where(eq(researchPaperTable.paperId, paperId))
      .limit(1);

    if (!paper) {
      throw new Error('Research paper not found');
    }

    // Update status to processing
    await db
      .update(researchPaperTable)
      .set({ parsingStatus: 'processing' })
      .where(eq(researchPaperTable.paperId, paperId));

    console.log('📥 Downloading file from URL:', fileUrl);

    // Download file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to download file from URL');
    }

    // Get file extension
    const fileExtension = `.${paper.fileType}`;

    // Create temporary file with proper extension
    const tempDir = '/tmp';
    const tempFileName = `${paperId}-${Date.now()}${fileExtension}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Save file to temp location
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(tempFilePath, buffer);

    console.log('📄 Processing research paper:', paper.title);
    console.log('📦 File size:', buffer.length, 'bytes');

    // Initialize LlamaCloud client
    const client = new LlamaCloud({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
    });

    console.log('☁️  Uploading to LlamaCloud...');

    // Use stream for upload
    const fileStream = fsSync.createReadStream(tempFilePath);

    // Upload file to LlamaCloud
    const fileObj = await client.files.create({
      file: fileStream,
      purpose: 'parse',
    });

    console.log('🔍 Parsing document with LlamaCloud...');

    // Parse the document with enhanced options for research papers
    const result = await client.parsing.parse({
      file_id: fileObj.id,
      tier: 'agentic',
      version: 'latest',

      input_options: {},

      output_options: {
        markdown: {
          tables: {
            output_tables_as_markdown: true, // Better for research papers
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

    // Extract tables and page data
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

    // Extract text per page
    const textPages =
      result.text?.pages?.map((page: any) => ({
        page_number: page.page_number,
        text: page.text,
      })) || [];

    // Create intelligent chunks for both DB and Pinecone
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

      // Detect content types
      const codeAnalysis = isCodeContent(textPage.text);
      const hasCitations = isCitationContent(textPage.text);

      // Split page text into smaller chunks with overlap
      const pageChunks = chunkTextWithOverlap(textPage.text, 800, 25);

      for (let chunkIdx = 0; chunkIdx < pageChunks.length; chunkIdx++) {
        const chunkText = pageChunks[chunkIdx];

        // Enhanced context header for better retrieval
        const contextHeader = `[${paper.title} - RESEARCH PAPER - Page ${textPage.page_number}]\n`;
        const fullChunkText = contextHeader + chunkText;

        // Prepare rich metadata
        const chunkMetadata = {
          paper_title: paper.title,
          authors: paper.authors,
          source: paper.source,
          category: paper.category,
          page_number: textPage.page_number,
          chunk_index: chunkIdx,
          total_page_chunks: pageChunks.length,
          has_tables: pageInfo?.tables?.length > 0 || false,
          is_code: codeAnalysis.isCode,
          has_citations: hasCitations,
          language: codeAnalysis.language,
          created_at: new Date().toISOString(),
        };

        // Store in DB
        chunksForDB.push({
          paperId: paperId,
          chunkText: chunkText,
          chunkOrder: chunkOrderCounter++,
          chunkType: codeAnalysis.isCode ? 'code' : hasCitations ? 'citation' : 'text',
          pageNumber: textPage.page_number,
          language: codeAnalysis.language,
          isCode: codeAnalysis.isCode,
          isCitation: hasCitations,
          isReference: false, // Could be enhanced with reference detection
          chunkMetadata: chunkMetadata,
        });

        // Store in Pinecone with rich metadata
        documentsForPinecone.push(
          new Document({
            pageContent: fullChunkText,
            metadata: {
              paper_id: paperId,
              user_id: paper.userId,
              ...chunkMetadata,
            },
          })
        );
      }

      // Handle tables separately
      if (pageInfo?.tables) {
        for (const table of pageInfo.tables) {
          const tableText =
            `[TABLE - ${paper.title} - Page ${textPage.page_number}]\n` +
            `Rows: ${table.rows}, Columns: ${table.columns}\n` +
            JSON.stringify(table.content, null, 2);

          const tableMetadata = {
            paper_title: paper.title,
            authors: paper.authors,
            page_number: textPage.page_number,
            chunk_type: 'table',
            table_rows: table.rows,
            table_columns: table.columns,
            created_at: new Date().toISOString(),
          };

          chunksForDB.push({
            paperId: paperId,
            chunkText: JSON.stringify(table.content),
            chunkOrder: chunkOrderCounter++,
            chunkType: 'table',
            pageNumber: textPage.page_number,
            isCode: false,
            isCitation: false,
            isReference: false,
            chunkMetadata: tableMetadata,
          });

          documentsForPinecone.push(
            new Document({
              pageContent: tableText,
              metadata: {
                paper_id: paperId,
                user_id: paper.userId,
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
      .insert(researchPaperChunksTable)
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

        // Store in Pinecone with embeddings in research-specific namespace
        await PineconeStore.fromDocuments(documentsForPinecone, embeddings, {
          pineconeIndex,
          namespace: `research_${paper.userId}`,
        });

        pineconeVectorsStored = documentsForPinecone.length;

        console.log(`✅ Stored ${pineconeVectorsStored} vectors in Pinecone`);

        // Update paper indexing status
        await db
          .update(researchPaperTable)
          .set({
            isIndexed: true,
            indexedAt: new Date(),
            vectorCount: pineconeVectorsStored,
            chunkCount: insertedChunks.length,
            parsingStatus: 'completed',
            parsingError: null,
          })
          .where(eq(researchPaperTable.paperId, paperId));
      } catch (embeddingError: any) {
        console.error(
          '⚠️  Error generating embeddings:',
          embeddingError.message
        );

        // Update with partial success
        await db
          .update(researchPaperTable)
          .set({
            isIndexed: false,
            chunkCount: insertedChunks.length,
            parsingStatus: 'completed',
            parsingError: `Chunks stored but embeddings failed: ${embeddingError.message}`,
          })
          .where(eq(researchPaperTable.paperId, paperId));
      }
    } else {
      console.log(
        '⚠️  Skipping embeddings: OpenAI or Pinecone not configured'
      );

      // Update with chunks only
      await db
        .update(researchPaperTable)
        .set({
          isIndexed: false,
          chunkCount: insertedChunks.length,
          parsingStatus: 'completed',
          parsingError: null,
        })
        .where(eq(researchPaperTable.paperId, paperId));
    }

    // Clean up temporary file
    await fs.unlink(tempFilePath);

    return {
      success: true,
      chunks_stored: insertedChunks.length,
      vectors_stored: pineconeVectorsStored,
    };
  } catch (error: any) {
    console.error('❌ Error parsing research paper:', error);

    // Update paper with error status
    try {
      await db
        .update(researchPaperTable)
        .set({
          parsingStatus: 'failed',
          parsingError: error.message,
        })
        .where(eq(researchPaperTable.paperId, paperId));
    } catch (updateError) {
      console.error('Error updating paper status:', updateError);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      chunks_stored: 0,
      vectors_stored: 0,
      error: errorMessage,
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

/**
 * Get all research papers for the current user
 * @route GET /api/research-papers
 */
export const getUserResearchPapers = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const papers = await db
        .select()
        .from(researchPaperTable)
        .where(eq(researchPaperTable.userId, req.user.userId))
        .orderBy(desc(researchPaperTable.createdAt));

      return res.status(200).json(
        new ApiResponse(200, { papers }, 'Research papers retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting research papers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json(
        new ApiResponse(500, { error: errorMessage }, 'Failed to retrieve research papers')
      );
    }
  }
);

/**
 * Get single research paper by ID
 * @route GET /api/research-papers/:paperId
 */
export const getResearchPaperById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const paperId = Array.isArray(req.params.paperId) 
        ? req.params.paperId[0] 
        : req.params.paperId;

      const [paper] = await db
        .select()
        .from(researchPaperTable)
        .where(
          and(
            eq(researchPaperTable.paperId, paperId),
            eq(researchPaperTable.userId, req.user.userId)
          )
        )
        .limit(1);

      if (!paper) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Research paper not found'));
      }

      // Get chunk count
      const chunks = await db
        .select()
        .from(researchPaperChunksTable)
        .where(eq(researchPaperChunksTable.paperId, paperId));

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            paper,
            chunks: chunks.length,
          },
          'Research paper retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Error getting research paper:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json(
        new ApiResponse(500, { error: errorMessage }, 'Failed to retrieve research paper')
      );
    }
  }
);

/**
 * Delete research paper
 * @route DELETE /api/research-papers/:paperId
 */
export const deleteResearchPaper = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const paperId = Array.isArray(req.params.paperId) 
        ? req.params.paperId[0] 
        : req.params.paperId;

      // Delete from database (chunks will be cascade deleted)
      const [deleted] = await db
        .delete(researchPaperTable)
        .where(
          and(
            eq(researchPaperTable.paperId, paperId),
            eq(researchPaperTable.userId, req.user.userId)
          )
        )
        .returning();

      if (!deleted) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Research paper not found'));
      }

      // TODO: Delete vectors from Pinecone (optional)
      // TODO: Delete file from R2 (optional)

      return res.status(200).json(
        new ApiResponse(200, { deleted }, 'Research paper deleted successfully')
      );
    } catch (error) {
      console.error('Error deleting research paper:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json(
        new ApiResponse(500, { error: errorMessage }, 'Failed to delete research paper')
      );
    }
  }
);

/**
 * Get parsing status for a research paper
 * @route GET /api/research-papers/:paperId/status
 */
export const getParsingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const paperId = Array.isArray(req.params.paperId) 
        ? req.params.paperId[0] 
        : req.params.paperId;

      const [paper] = await db
        .select({
          paperId: researchPaperTable.paperId,
          title: researchPaperTable.title,
          parsingStatus: researchPaperTable.parsingStatus,
          parsingError: researchPaperTable.parsingError,
          isIndexed: researchPaperTable.isIndexed,
          indexedAt: researchPaperTable.indexedAt,
          vectorCount: researchPaperTable.vectorCount,
          chunkCount: researchPaperTable.chunkCount,
        })
        .from(researchPaperTable)
        .where(
          and(
            eq(researchPaperTable.paperId, paperId),
            eq(researchPaperTable.userId, req.user.userId)
          )
        )
        .limit(1);

      if (!paper) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Research paper not found'));
      }

      return res.status(200).json(
        new ApiResponse(200, paper, 'Parsing status retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting parsing status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json(
        new ApiResponse(500, { error: errorMessage }, 'Failed to get parsing status')
      );
    }
  }
);
