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
  chatTable,
  chatMessageTable,
  materialTable,
  materialChunksTable,
} from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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
    model: 'gemini-2.5-flash', // Valid models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp
    temperature: 0.7,
    maxOutputTokens: 2048,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

// System prompt for the AI tutor
const SYSTEM_PROMPT = `You are an intelligent AI tutor assistant. Your role is to help students understand their course materials effectively.

Guidelines:
- Provide clear, accurate, and educational responses based on the course materials provided
- If the context contains relevant information, use it to answer the question accurately
- If the context doesn't contain enough information, use your general knowledge but acknowledge the limitation
- Break down complex concepts into simpler explanations
- Provide examples when helpful
- Be encouraging and supportive in your teaching approach
- Format your responses in a clear, structured manner using markdown when appropriate

IMPORTANT - Material Citations:
- When you use information from the provided "Relevant Course Materials" context, you MUST mention which material you're using
- Include the material name naturally in your response (e.g., "According to HTML Basics...", "As explained in the lecture notes...")
- If a page number is provided in the source, you can mention it (e.g., "HTML Basics (Page 2) explains...")
- The material references will be automatically displayed to the user below your response, so you don't need to create a separate reference section
- Your response should flow naturally while acknowledging sources

Example good citation:
"HTML elements are building blocks of web pages. According to HTML Basics, common tags include <h1> for headings, <p> for paragraphs, and <a> for links."`;


interface MaterialReference {
  materialId: string;
  materialName: string;
  fileName: string;
  url: string;
  chunkIds: string[];
  relevantChunks: string[];
}

/**
 * Query Pinecone for relevant context chunks using Langchain PineconeStore
 */
async function queryRelevantContext(
  courseId: string,
  query: string,
  topK: number = 5
): Promise<{ chunks: any[]; materialIds: string[] }> {
  try {
    const pineconeClient = getPineconeClient();
    const embeddings = getEmbeddings();

    if (!pineconeClient || !embeddings) {
      console.log('Pinecone or embeddings not configured, skipping RAG');
      return { chunks: [], materialIds: [] };
    }

    if (!process.env.PINECONE_INDEX) {
      console.log('PINECONE_INDEX environment variable not set');
      return { chunks: [], materialIds: [] };
    }

    const indexName = process.env.PINECONE_INDEX;

    // Get the Pinecone index
    const pineconeIndex = pineconeClient.Index(indexName);

    // Create vector store from existing index with namespace
    const namespace = `course_${courseId}`;
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
    });

    console.log(`🔍 Searching in namespace: ${namespace}`);

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearch(query, topK);

    console.log(`📚 Found ${relevantDocs.length} relevant documents`);

    // Transform Langchain documents to our format (keep snake_case to match storage)
    const chunks = relevantDocs.map((doc: any, idx: number) => ({
      id: doc.metadata?.chunk_id || `chunk_${idx}`,
      score: doc.metadata?.score || 0,
      pageContent: doc.pageContent,
      metadata: {
        material_id: doc.metadata?.material_id,
        text: doc.pageContent,
        material_name: doc.metadata?.material_name,
        chunk_type: doc.metadata?.chunk_type,
        page_number: doc.metadata?.page_number,
        is_code: doc.metadata?.is_code,
        chunk_id: doc.metadata?.chunk_id,
        language: doc.metadata?.language,
      },
    }));

    const materialIds = [
      ...new Set(
        chunks.map((chunk: any) => chunk.metadata?.material_id).filter(Boolean)
      ),
    ];

    console.log(`🔍 Found ${chunks.length} chunks, ${materialIds.length} unique materials`);
    if (materialIds.length === 0 && chunks.length > 0) {
      console.log('⚠️  Debug first chunk:', JSON.stringify(chunks[0], null, 2));
    }
    
    return { chunks, materialIds };
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return { chunks: [], materialIds: [] };
  }
}

/**
 * Get material references from retrieved chunks
 */
async function getMaterialReferences(
  chunks: any[],
  materialIds: string[]
): Promise<MaterialReference[]> {
  if (materialIds.length === 0) {
    return [];
  }

  try {
    // Fetch material details from database
    const materials = await db
      .select()
      .from(materialTable)
      .where(inArray(materialTable.materialId, materialIds));

    console.log(`🗄️  Fetched ${materials.length} materials from DB for ${materialIds.length} material IDs`);
    
    // Group chunks by material
    const referencesMap = new Map<string, MaterialReference>();

    for (const chunk of chunks) {
      const materialId = chunk.metadata?.material_id;  // Use snake_case as stored in Pinecone
      if (!materialId) continue;

      const material = materials.find((m) => m.materialId === materialId);
      if (!material) continue;

      if (!referencesMap.has(materialId)) {
        const fileName = material.url ? material.url.split('/').pop() || material.name : material.name;
        referencesMap.set(materialId, {
          materialId,
          materialName: material.name,
          fileName,
          url: material.url,
          chunkIds: [],
          relevantChunks: [],
        });
      }

      const ref = referencesMap.get(materialId)!;
      ref.chunkIds.push(chunk.id);
      ref.relevantChunks.push(chunk.metadata?.text || chunk.pageContent || '');
    }

    console.log(`📑 Built ${referencesMap.size} material references`);
    
    return Array.from(referencesMap.values());
  } catch (error) {
    console.error('Error fetching material references:', error);
    return [];
  }
}

/**
 * Stream AI chat response with RAG
 * @route POST /api/chats/:chatId/ai-response
 */
export const streamAIChatResponse = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;
    const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
    const { question } = req.body;

    if (!userId) {
      return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
    }

    if (!question || !question.trim()) {
      return res.status(400).json(new ApiResponse(400, {}, 'Question is required'));
    }

    try {
      // Verify chat ownership
      const [chat] = await db
        .select()
        .from(chatTable)
        .where(and(eq(chatTable.chatId, chatId), eq(chatTable.userId, userId)))
        .limit(1);

      if (!chat) {
        return res.status(404).json(new ApiResponse(404, {}, 'Chat not found or access denied'));
      }

      // Get chat history (last 10 messages for context)
      const chatHistory = await db
        .select()
        .from(chatMessageTable)
        .where(eq(chatMessageTable.chatId, chatId))
        .orderBy(chatMessageTable.createdAt)
        .limit(10);

      // Query Pinecone for relevant context
      const { chunks, materialIds } = await queryRelevantContext(chat.courseId, question, 5);

      // Get material references
      const materialReferences = await getMaterialReferences(chunks, materialIds);
      
      console.log(`📚 Retrieved ${chunks.length} chunks from ${materialIds.length} unique materials`);
      console.log(`📑 Material references: ${materialReferences.length}`);

      // Build context from retrieved chunks
      let contextText = '';
      if (chunks.length > 0) {
        contextText = '\n\nRelevant Course Materials:\n';
        chunks.forEach((chunk: any, index: number) => {
          const ref = materialReferences.find(r => r.materialId === chunk.metadata?.material_id);
          const materialName = ref?.materialName || 'Unknown Material';
          const pageNum = chunk.metadata?.page_number ? ` (Page ${chunk.metadata.page_number})` : '';
          contextText += `\n[Source ${index + 1} - Material: ${materialName}${pageNum}]\n${chunk.metadata?.text || chunk.pageContent || ''}\n`;
        });
        
        console.log('📝 Context built with', chunks.length, 'chunks');
      } else {
        console.log('⚠️  No chunks found for context');
      }

      // Build messages for the model
      const messages: any[] = [
        new SystemMessage(SYSTEM_PROMPT),
      ];

      // Add chat history for context (last few messages)
      chatHistory.slice(-6).forEach((msg) => {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
          messages.push(new AIMessage(msg.content));
        }
      });

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

        // Send material references at the end
        if (materialReferences.length > 0) {
          console.log(`📤 Sending ${materialReferences.length} material references to client:`);
          materialReferences.forEach(ref => {
            console.log(`   - ${ref.materialName} (${ref.fileName}) - ${ref.chunkIds.length} chunks`);
          });
          res.write(`data: ${JSON.stringify({ type: 'references', data: materialReferences })}\n\n`);
        } else {
          console.log('⚠️  No material references to send - chunks may not have valid material_id metadata');
        }

        // Send completion signal
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

        // Save the complete response to database
        const newMessage = {
          messageId: require('nanoid').nanoid(),
          chatId,
          role: 'assistant' as const,
          content: fullResponse,
          attachments: materialReferences.length > 0 ? { references: materialReferences } : null,
        };

        await db.insert(chatMessageTable).values(newMessage);

        // Update chat's updatedAt timestamp
        await db
          .update(chatTable)
          .set({ updatedAt: new Date() })
          .where(eq(chatTable.chatId, chatId));

      } catch (streamError) {
        console.error('Error during streaming:', streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Error generating response' })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('Error in AI chat response:', error);
      
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
 * Non-streaming AI chat response (fallback)
 * @route POST /api/chats/:chatId/ai-response-sync
 */
export const getAIChatResponse = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user?.userId;
    const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
    const { question } = req.body;

    if (!userId) {
      return res.status(401).json(new ApiResponse(401, {}, 'User not authenticated'));
    }

    if (!question || !question.trim()) {
      return res.status(400).json(new ApiResponse(400, {}, 'Question is required'));
    }

    try {
      // Verify chat ownership
      const [chat] = await db
        .select()
        .from(chatTable)
        .where(and(eq(chatTable.chatId, chatId), eq(chatTable.userId, userId)))
        .limit(1);

      if (!chat) {
        return res.status(404).json(new ApiResponse(404, {}, 'Chat not found or access denied'));
      }

      // Get chat history
      const chatHistory = await db
        .select()
        .from(chatMessageTable)
        .where(eq(chatMessageTable.chatId, chatId))
        .orderBy(chatMessageTable.createdAt)
        .limit(10);

      // Query Pinecone for relevant context
      const { chunks, materialIds } = await queryRelevantContext(chat.courseId, question, 5);

      // Get material references
      const materialReferences = await getMaterialReferences(chunks, materialIds);

      // Build context
      let contextText = '';
      if (chunks.length > 0) {
        contextText = '\n\nRelevant Course Materials:\n';
        chunks.forEach((chunk: any) => {
          const materialName = materialReferences.find(ref => ref.materialId === chunk.metadata?.materialId)?.materialName || 'Unknown Material';
          contextText += `\n[Material: ${materialName}]\n${chunk.metadata?.text || ''}\n`;
        });
      }

      // Build messages
      const messages: any[] = [
        new SystemMessage(SYSTEM_PROMPT),
      ];

      chatHistory.slice(-6).forEach((msg) => {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
          messages.push(new AIMessage(msg.content));
        }
      });

      const questionWithContext = contextText
        ? `${question}\n${contextText}`
        : question;

      messages.push(new HumanMessage(questionWithContext));

      // Get response from Gemini
      const model = getGeminiModel();
      const response = await model.invoke(messages);

      const answerContent = response.content as string;

      // Save messages to database
      const { nanoid } = await import('nanoid');
      
      const userMessage = {
        messageId: nanoid(),
        chatId,
        role: 'user' as const,
        content: question,
        attachments: null,
      };

      const assistantMessage = {
        messageId: nanoid(),
        chatId,
        role: 'assistant' as const,
        content: answerContent,
        attachments: materialReferences.length > 0 ? { references: materialReferences } : null,
      };

      await db.insert(chatMessageTable).values([userMessage, assistantMessage]);

      // Update chat timestamp
      await db
        .update(chatTable)
        .set({ updatedAt: new Date() })
        .where(eq(chatTable.chatId, chatId));

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            answer: answerContent,
            references: materialReferences,
            userMessage,
            assistantMessage,
          },
          'Response generated successfully'
        )
      );
    } catch (error) {
      console.error('Error in AI chat response:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
