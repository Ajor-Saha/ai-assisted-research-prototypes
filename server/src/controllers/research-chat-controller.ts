import { Request, Response } from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';
import { db } from '../db';
import {
  researchPaperTable,
  researchPaperChunksTable,
  researchChatTable,
  researchChatMessageTable,
} from '../db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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

// Initialize OpenAI Embeddings - Using large model for consistency
const getEmbeddings = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
    dimensions: 1024,
  });
};

// Initialize Google Gemini model
const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Google API key not configured');
  }
  
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxOutputTokens: 2048,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

// System prompt for the Research AI Assistant
const SYSTEM_PROMPT = `You are an intelligent Research Assistant specialized in analyzing academic papers and research documents. Your role is to help researchers and students understand complex research materials effectively.

Guidelines:
- Provide clear, accurate, and scholarly responses based on the research papers provided
- If the context contains relevant information, use it to answer the question accurately with proper academic rigor
- If the context doesn't contain enough information, acknowledge the limitation and provide general guidance
- Break down complex research concepts into understandable explanations
- Analyze methodologies, findings, and conclusions critically
- Compare and contrast different papers when relevant
- Identify research gaps and limitations when appropriate
- Format your responses in a clear, structured manner using markdown when appropriate

IMPORTANT - Paper Citations:
- When you use information from the provided "Relevant Research Papers" context, you MUST cite which paper you're referencing
- Include the paper name naturally in your response (e.g., "According to [Paper Title]...", "As demonstrated in the study...")
- If a page number is provided, mention it (e.g., "[Paper Title] (Page 5) demonstrates...")
- The paper references will be automatically displayed to the user below your response
- Your response should maintain academic integrity while being accessible

Example good citation:
"The methodology section of 'Machine Learning in Healthcare' demonstrates a robust approach using cross-validation techniques. The authors employ a dataset of 10,000 patients (Page 12) to validate their hypothesis."`;

interface PaperReference {
  paperId: string;
  fileName: string;
  fileUrl: string;
  chunkIds: string[];
  relevantChunks: string[];
}

/**
 * Query Pinecone for relevant research paper chunks
 */
async function queryRelevantResearchContext(
  userId: string,
  query: string,
  topK: number = 5
): Promise<{ chunks: any[]; paperIds: string[] }> {
  try {
    const pineconeClient = getPineconeClient();
    const embeddings = getEmbeddings();

    if (!pineconeClient || !embeddings) {
      console.log('Pinecone or embeddings not configured, skipping RAG');
      return { chunks: [], paperIds: [] };
    }

    if (!process.env.PINECONE_INDEX) {
      console.log('PINECONE_INDEX environment variable not set');
      return { chunks: [], paperIds: [] };
    }

    const indexName = process.env.PINECONE_INDEX;

    // Get the Pinecone index
    const pineconeIndex = pineconeClient.Index(indexName);

    // Create vector store from existing index with user-specific namespace
    const namespace = `research_${userId}`;
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
    });

    console.log(`🔍 Searching research papers in namespace: ${namespace}`);

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearch(query, topK);

    console.log(`📚 Found ${relevantDocs.length} relevant research chunks`);

    // Transform Langchain documents to our format
    const chunks = relevantDocs.map((doc: any, idx: number) => ({
      id: doc.metadata?.chunk_id || `chunk_${idx}`,
      score: doc.metadata?.score || 0,
      pageContent: doc.pageContent,
      metadata: {
        paper_id: doc.metadata?.paper_id,
        text: doc.pageContent,
        file_name: doc.metadata?.file_name,
        chunk_type: doc.metadata?.chunk_type,
        page_number: doc.metadata?.page_number,
        is_code: doc.metadata?.is_code,
        chunk_id: doc.metadata?.chunk_id,
      },
    }));

    const paperIds = [
      ...new Set(
        chunks.map((chunk: any) => chunk.metadata?.paper_id).filter(Boolean)
      ),
    ];

    console.log(`🔍 Found ${chunks.length} chunks from ${paperIds.length} unique papers`);
    if (paperIds.length === 0 && chunks.length > 0) {
      console.log('⚠️  Debug first chunk:', JSON.stringify(chunks[0], null, 2));
    }
    
    return { chunks, paperIds };
  } catch (error) {
    console.error('Error querying Pinecone for research papers:', error);
    return { chunks: [], paperIds: [] };
  }
}

/**
 * Get paper references from retrieved chunks
 */
async function getPaperReferences(
  chunks: any[],
  paperIds: string[]
): Promise<PaperReference[]> {
  if (paperIds.length === 0) {
    return [];
  }

  try {
    // Fetch paper details from database
    const papers = await db
      .select()
      .from(researchPaperTable)
      .where(inArray(researchPaperTable.paperId, paperIds));

    console.log(`🗄️  Fetched ${papers.length} papers from DB for ${paperIds.length} paper IDs`);
    
    // Group chunks by paper
    const referencesMap = new Map<string, PaperReference>();

    for (const chunk of chunks) {
      const paperId = chunk.metadata?.paper_id;
      if (!paperId) continue;

      const paper = papers.find((p) => p.paperId === paperId);
      if (!paper) continue;

      if (!referencesMap.has(paperId)) {
        referencesMap.set(paperId, {
          paperId,
          fileName: paper.fileName,
          fileUrl: paper.fileUrl,
          chunkIds: [],
          relevantChunks: [],
        });
      }

      const ref = referencesMap.get(paperId)!;
      ref.chunkIds.push(chunk.id);
      ref.relevantChunks.push(chunk.metadata?.text || chunk.pageContent || '');
    }

    console.log(`📑 Built ${referencesMap.size} paper references`);
    
    return Array.from(referencesMap.values());
  } catch (error) {
    console.error('Error fetching paper references:', error);
    return [];
  }
}

/**
 * Get or create the default research chat for a user
 * Research chat is per-user (not per-conversation like math chat)
 */
async function getOrCreateResearchChat(userId: string): Promise<string> {
  try {
    // Try to find existing research chat for the user
    const existingChats = await db
      .select()
      .from(researchChatTable)
      .where(eq(researchChatTable.userId, userId))
      .limit(1);

    if (existingChats.length > 0) {
      return existingChats[0].researchChatId;
    }

    // Create new research chat
    const chatId = nanoid();
    await db.insert(researchChatTable).values({
      researchChatId: chatId,
      userId,
      title: 'Research Assistant Chat',
    });

    console.log(`✨ Created new research chat for user ${userId}: ${chatId}`);
    return chatId;
  } catch (error) {
    console.error('Error getting/creating research chat:', error);
    throw error;
  }
}

/**
 * Stream AI research chat response with RAG
 * @route POST /api/research-papers/chat
 */
export const streamResearchChatResponse = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;
    const { question } = req.body;

    if (!userId) {
      return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
    }

    if (!question || !question.trim()) {
      return res.status(400).json(new ApiResponse(400, {}, 'Question is required'));
    }

    try {
      // Get or create research chat for this user
      const chatId = await getOrCreateResearchChat(userId);

      // Save user message to database
      const userMessageId = nanoid();
      await db.insert(researchChatMessageTable).values({
        messageId: userMessageId,
        researchChatId: chatId,
        role: 'user',
        content: question,
        metadata: null,
      });

      console.log(`💬 Saved user message: ${userMessageId}`);

      // Query Pinecone for relevant research paper context
      const { chunks, paperIds } = await queryRelevantResearchContext(userId, question, 5);

      // Get paper references
      const paperReferences = await getPaperReferences(chunks, paperIds);
      
      console.log(`📚 Retrieved ${chunks.length} chunks from ${paperIds.length} unique papers`);
      console.log(`📑 Paper references: ${paperReferences.length}`);

      // Build context from retrieved chunks
      let contextText = '';
      if (chunks.length > 0) {
        contextText = '\n\nRelevant Research Papers:\n';
        chunks.forEach((chunk: any, index: number) => {
          const ref = paperReferences.find(r => r.paperId === chunk.metadata?.paper_id);
          const fileName = ref?.fileName || 'Unknown Paper';
          const pageNum = chunk.metadata?.page_number ? ` (Page ${chunk.metadata.page_number})` : '';
          contextText += `\n[Source ${index + 1} - Paper: ${fileName}${pageNum}]\n${chunk.metadata?.text || chunk.pageContent || ''}\n`;
        });
        
        console.log('📝 Context built with', chunks.length, 'chunks');
      } else {
        console.log('⚠️  No chunks found for context - user may not have uploaded papers yet');
      }

      // Build messages for the model (no chat history - single Q&A)
      const messages: any[] = [
        new SystemMessage(SYSTEM_PROMPT),
      ];

      // Add current question with context
      const questionWithContext = contextText
        ? `${question}\n${contextText}`
        : question;

      messages.push(new HumanMessage(questionWithContext));

      // Initialize Gemini model
      const model = getGeminiModel();

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';

      try {
        // Stream the response
        const stream = await model.stream(messages);

        for await (const chunk of stream) {
          const content = chunk.content;
          if (content) {
            fullResponse += content;
            // Send chunk to client as SSE
            res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
          }
        }

        // Save AI response to database
        const aiMessageId = nanoid();
        await db.insert(researchChatMessageTable).values({
          messageId: aiMessageId,
          researchChatId: chatId,
          role: 'assistant',
          content: fullResponse,
          paperReferences: paperReferences.length > 0 ? paperReferences : null,
          metadata: null,
        });

        console.log(`🤖 Saved AI message: ${aiMessageId}`);

        // Send paper references at the end
        if (paperReferences.length > 0) {
          console.log(`📤 Sending ${paperReferences.length} paper references to client:`);
          paperReferences.forEach(ref => {
            console.log(`   - ${ref.fileName} - ${ref.chunkIds.length} chunks`);
          });
          res.write(`data: ${JSON.stringify({ type: 'references', data: paperReferences })}\n\n`);
        } else {
          console.log('⚠️  No paper references to send');
        }

        // Send completion signal
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

      } catch (streamError) {
        console.error('Error during streaming:', streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Error generating response' })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('Error in research chat response:', error);
      
      if (!res.headersSent) {
        return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`);
        res.end();
      }
    }
  }
);

/**
 * Fetch all messages for the user's research chat
 * @route GET /api/research-papers/messages
 */
export const getResearchChatMessages = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
    }

    try {
      // Get the user's research chat
      const chatId = await getOrCreateResearchChat(userId);

      // Fetch all messages for this chat, ordered by created time
      const messages = await db
        .select()
        .from(researchChatMessageTable)
        .where(eq(researchChatMessageTable.researchChatId, chatId))
        .orderBy(researchChatMessageTable.createdAt);

      console.log(`📨 Fetched ${messages.length} messages for chat ${chatId}`);

      return res.status(200).json(
        new ApiResponse(200, messages, 'Messages fetched successfully')
      );
    } catch (error) {
      console.error('Error fetching research chat messages:', error);
      return res.status(500).json(
        new ApiResponse(500, null, 'Failed to fetch messages')
      );
    }
  }
);
