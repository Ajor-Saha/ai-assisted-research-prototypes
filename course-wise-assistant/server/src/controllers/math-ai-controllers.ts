import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';
import { db } from '../db';
import { mathChatTable, mathChatMessageTable } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { CambClient } from '@camb-ai/sdk';

// Initialize Google Gemini model for math assistance
const getGeminiMathModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Google API key not configured');
  }
  
  return new ChatGoogleGenerativeAI({
    model: 'gemini-3-flash-preview',
    temperature: 0.3, // Lower temperature for more precise math answers
    maxOutputTokens: 4096,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

// Enhanced system prompt for math assistance with step-by-step solutions
const MATH_SYSTEM_PROMPT = `You are an expert mathematics tutor and problem solver. Your role is to help students understand and solve mathematical problems with detailed explanations.

CORE PRINCIPLES:
- Provide step-by-step solutions with clear explanations for each step
- Show all calculations and intermediate steps
- Use proper mathematical notation and formatting with markdown
- Include visual descriptions where helpful (e.g., "imagine a right triangle with...")
- Explain the reasoning behind each step
- Provide examples when introducing new concepts
- Be encouraging and patient

RESPONSE FORMAT:
For each problem, structure your response as:

1. **Problem Understanding**: Briefly restate what we're solving
2. **Key Concepts**: List relevant formulas, theorems, or principles
3. **Step-by-Step Solution**: 
   - Break down the solution into clear, numbered steps
   - Show all calculations explicitly
   - Explain WHY each step is taken
   - Use mathematical notation: formulas in LaTeX-style formatting where appropriate
4. **Final Answer**: Clearly state the final answer, boxed or highlighted
5. **Visual Explanation** (when applicable): Describe how to visualize the problem
6. **Key Insights**: Summarize important takeaways or common mistakes to avoid

MATHEMATICAL FORMATTING:
- Use markdown for clear structure
- Use inline code for variables: \`x\`, \`y\`
- Use code blocks for equations and calculations
- Use bullet points or numbered lists for steps
- Use headings to separate sections
- Use bold for emphasis on key points

EXAMPLES TO INCLUDE:
- When explaining a concept, provide a simple example first
- Show how the same principle applies to similar problems
- Demonstrate common variations

AREAS OF EXPERTISE:
- Algebra (equations, inequalities, functions)
- Geometry (shapes, angles, proofs)
- Trigonometry (identities, equations)
- Calculus (limits, derivatives, integrals)
- Statistics (probability, distributions)
- Linear Algebra (matrices, vectors)
- Number Theory
- Word Problems (translate to mathematical form)

SPECIAL HANDLING:
- **Proofs**: Provide rigorous logical steps
- **Graph Problems**: Describe what the graph looks like, key points, behavior
- **Complex Calculations**: Break into manageable sub- calculations
- **Multiple Solutions**: Explain all possible solutions and when they apply

Remember: The goal is not just to provide an answer, but to teach the student how to solve similar problems independently.`;

/**
 * Create a new math chat
 * @route POST /api/math-chats
 */
export const createMathChat = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { title } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Create new math chat
      const newMathChat = {
        mathChatId: nanoid(),
        userId,
        title: title?.trim() || 'New Math Chat',
      };

      const [createdChat] = await db
        .insert(mathChatTable)
        .values(newMathChat)
        .returning();

      return res
        .status(201)
        .json(new ApiResponse(201, createdChat, 'Math chat created successfully'));
    } catch (error) {
      console.error('Error creating math chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Get all math chats for the authenticated user
 * @route GET /api/math-chats
 */
export const getUserMathChats = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Get all math chats for the user
      const chats = await db
        .select()
        .from(mathChatTable)
        .where(eq(mathChatTable.userId, userId))
        .orderBy(desc(mathChatTable.updatedAt));

      return res
        .status(200)
        .json(new ApiResponse(200, chats, 'Math chats retrieved successfully'));
    } catch (error) {
      console.error('Error fetching math chats:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Get a single math chat by ID with its messages
 * @route GET /api/math-chats/:chatId
 */
export const getMathChatById = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId) 
        ? req.params.chatId[0] 
        : req.params.chatId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Get chat and verify ownership
      const [chat] = await db
        .select()
        .from(mathChatTable)
        .where(
          and(
            eq(mathChatTable.mathChatId, chatId),
            eq(mathChatTable.userId, userId)
          )
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Math chat not found'));
      }

      // Get all messages for the chat
      const messages = await db
        .select()
        .from(mathChatMessageTable)
        .where(eq(mathChatMessageTable.mathChatId, chatId))
        .orderBy(mathChatMessageTable.createdAt);

      const chatWithMessages = {
        ...chat,
        messages,
      };

      return res
        .status(200)
        .json(
          new ApiResponse(200, chatWithMessages, 'Math chat retrieved successfully')
        );
    } catch (error) {
      console.error('Error fetching math chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Update math chat title
 * @route PUT /api/math-chats/:chatId
 */
export const updateMathChat = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId)
        ? req.params.chatId[0]
        : req.params.chatId;
      const { title } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify ownership
      const [chat] = await db
        .select()
        .from(mathChatTable)
        .where(
          and(
            eq(mathChatTable.mathChatId, chatId),
            eq(mathChatTable.userId, userId)
          )
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Math chat not found'));
      }

      // Update chat
      const [updatedChat] = await db
        .update(mathChatTable)
        .set({ title: title?.trim() || chat.title })
        .where(eq(mathChatTable.mathChatId, chatId))
        .returning();

      return res
        .status(200)
        .json(new ApiResponse(200, updatedChat, 'Math chat updated successfully'));
    } catch (error) {
      console.error('Error updating math chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Delete a math chat
 * @route DELETE /api/math-chats/:chatId
 */
export const deleteMathChat = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId)
        ? req.params.chatId[0]
        : req.params.chatId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify ownership
      const [chat] = await db
        .select()
        .from(mathChatTable)
        .where(
          and(
            eq(mathChatTable.mathChatId, chatId),
            eq(mathChatTable.userId, userId)
          )
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Math chat not found'));
      }

      // Delete chat (messages will be cascaded)
      await db
        .delete(mathChatTable)
        .where(eq(mathChatTable.mathChatId, chatId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Math chat deleted successfully'));
    } catch (error) {
      console.error('Error deleting math chat:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Add a message to a math chat
 * @route POST /api/math-chats/:chatId/messages
 */
export const addMathChatMessage = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId)
        ? req.params.chatId[0]
        : req.params.chatId;
      const { role, content, attachments, metadata } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify chat ownership
      const [chat] = await db
        .select()
        .from(mathChatTable)
        .where(
          and(
            eq(mathChatTable.mathChatId, chatId),
            eq(mathChatTable.userId, userId)
          )
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Math chat not found'));
      }

      // Create new message
      const newMessage = {
        messageId: nanoid(),
        mathChatId: chatId,
        role,
        content,
        attachments: attachments || null,
        metadata: metadata || null,
      };

      const [createdMessage] = await db
        .insert(mathChatMessageTable)
        .values(newMessage)
        .returning();

      return res
        .status(201)
        .json(new ApiResponse(201, createdMessage, 'Message added successfully'));
    } catch (error) {
      console.error('Error adding message:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

/**
 * Stream AI response for a math problem
 * @route POST /api/math-chats/:chatId/stream
 */
export const streamMathAIResponse = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.userId;
      const chatId = Array.isArray(req.params.chatId)
        ? req.params.chatId[0]
        : req.params.chatId;
      const { userMessage, imageFile } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'User not authenticated'));
      }

      // Verify chat ownership
      const [chat] = await db
        .select()
        .from(mathChatTable)
        .where(
          and(
            eq(mathChatTable.mathChatId, chatId),
            eq(mathChatTable.userId, userId)
          )
        )
        .limit(1);

      if (!chat) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Math chat not found'));
      }

      // Get chat history
      const messages = await db
        .select()
        .from(mathChatMessageTable)
        .where(eq(mathChatMessageTable.mathChatId, chatId))
        .orderBy(mathChatMessageTable.createdAt)
        .limit(10); // Last 10 messages for context

      // Save user message first
      const userMsg = {
        messageId: nanoid(),
        mathChatId: chatId,
        role: 'user' as const,
        content: userMessage,
        attachments: imageFile ? { imageFile } : null,
        metadata: null,
      };

      await db.insert(mathChatMessageTable).values(userMsg);

      // Set up SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const model = getGeminiMathModel();

        // Build message history for context
        const chatHistory = [
          new SystemMessage(MATH_SYSTEM_PROMPT),
          ...messages.map((msg) =>
            msg.role === 'user'
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(userMessage),
        ];

        // Stream the response
        const stream = await model.stream(chatHistory);

        let fullResponse = '';

        for await (const chunk of stream) {
          const content = chunk.content.toString();
          fullResponse += content;

          // Send chunk to client
          res.write(
            `data: ${JSON.stringify({
              type: 'chunk',
              content,
            })}\n\n`
          );
        }

        // Save assistant message
        const assistantMsg = {
          messageId: nanoid(),
          mathChatId: chatId,
          role: 'assistant' as const,
          content: fullResponse,
          attachments: null,
          metadata: null,
        };

        await db.insert(mathChatMessageTable).values(assistantMsg);

        // Send completion signal
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            messageId: assistantMsg.messageId,
          })}\n\n`
        );

        res.end();
      } catch (aiError) {
        console.error('AI Error:', aiError);
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to generate response',
          })}\n\n`
        );
        res.end();
      }
    } catch (error) {
      console.error('Error in streaming:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json(new ApiResponse(500, null, 'Internal server error'));
      }
    }
  }
);

/**
 * Translate message content to Bangla
 * @route POST /api/math-chats/translate
 */
export const translateToBangla = asyncHandler(
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { content } = req.body;

      if (!content) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, 'Content is required'));
      }

      // Initialize Gemini model for translation
      const model = new ChatGoogleGenerativeAI({
        model: 'gemini-3-flash-preview',
        temperature: 0.2,
        maxOutputTokens: 8192,
        apiKey: process.env.GEMINI_API_KEY,
      });

      // Translation prompt
      const translationPrompt = `Translate the following mathematics content from English to Bangla (Bengali). 

IMPORTANT INSTRUCTIONS:
1. Translate all explanatory text to Bangla
2. Keep mathematical symbols, equations, and LaTeX notation EXACTLY as they are (do not translate)
3. Keep markdown formatting (headings, lists, bold, italic, code blocks)
4. Maintain the structure and flow of the content
5. Use proper Bangla mathematical terminology
6. Keep numbers in English numerals
7. Preserve all LaTeX equations within $ or $$ delimiters unchanged

Examples:
- "The slope of a line" → "একটি রেখার ঢাল"
- "$f(x) = x^2$" → "$f(x) = x^2$" (keep unchanged)
- "**Step 1:**" → "**ধাপ ১:**"
- "Calculate the derivative" → "অন্তরকলন নির্ণয় করুন"

Content to translate:

${content}

Provide ONLY the translated content without any additional explanations or notes.`;

      const messages = [
        new SystemMessage('You are an expert translator specializing in mathematical and technical content translation to Bangla.'),
        new HumanMessage(translationPrompt),
      ];

      const response = await model.invoke(messages);
      const translatedContent = response.content.toString();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { translatedContent },
            'Content translated successfully'
          )
        );
    } catch (error) {
      console.error('Error translating content:', error);
      res
        .status(500)
        .json(new ApiResponse(500, null, 'Translation failed'));
    }
  }
);

/**
 * Text-to-Speech for Bangla content using Camb.ai
 * POST /api/math-chats/text-to-speech
 */
export const banglaTextToSpeech = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, 'Text is required'));
      }

      if (!process.env.CAMB_API_KEY) {
        return res
          .status(500)
          .json(new ApiResponse(500, null, 'Camb.ai API key not configured'));
      }

      // Initialize Camb.ai client
      const client = new CambClient({
        apiKey: process.env.CAMB_API_KEY
      });

      // Clean text for better speech synthesis
      // Remove LaTeX equations and markdown formatting
      let cleanText = text
        .replace(/\$\$[^$]+\$\$/g, '') // Remove display equations
        .replace(/\$[^$]+\$/g, '') // Remove inline equations
        .replace(/#{1,6}\s/g, '') // Remove markdown headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove code
        .replace(/\n+/g, ' ') // Replace newlines with space
        .trim();

      if (!cleanText) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, 'No valid text to convert to speech'));
      }

      // Handle character limit (500 chars for free plan)
      const MAX_CHARS = 500;
      if (cleanText.length > MAX_CHARS) {
        console.log(`TTS: Text length ${cleanText.length} exceeds limit, truncating to ${MAX_CHARS} chars`);
        // Truncate at word boundary for better speech quality
        cleanText = cleanText.substring(0, MAX_CHARS);
        const lastSpaceIndex = cleanText.lastIndexOf(' ');
        if (lastSpaceIndex > 0) {
          cleanText = cleanText.substring(0, lastSpaceIndex);
        }
        // Try to end at sentence boundary
        const lastPeriod = cleanText.lastIndexOf('।'); // Bangla period
        const lastEnglishPeriod = cleanText.lastIndexOf('.');
        const sentenceEnd = Math.max(lastPeriod, lastEnglishPeriod);
        if (sentenceEnd > MAX_CHARS * 0.7) { // Only use if we're not cutting off too much
          cleanText = cleanText.substring(0, sentenceEnd + 1);
        }
      }

      console.log(`TTS: Generating speech for ${cleanText.length} characters of Bangla text`);

      console.log(`TTS: Generating speech for ${cleanText.length} characters of Bangla text`);

      // Generate speech using Camb.ai
      // Using Bangla (Bangladesh) locale: bn-bd
      let response;
      try {
        response = await client.textToSpeech.tts({
          text: cleanText,
          language: 'bn-bd', // Bangla (Bangladesh)
          voice_id: 147320, // Default voice (can be customized)
          speech_model: 'mars-flash' as any, // Fast model for real-time applications (type mismatch in SDK)
          output_configuration: {
            format: 'mp3' // MP3 format for web compatibility
          }
        });
      } catch (cambError: any) {
        console.error('Camb.ai API error:', cambError);
        return res
          .status(500)
          .json(new ApiResponse(500, null, `TTS API error: ${cambError.message || 'Unknown error'}`));
      }

      // Check if stream is available
      const stream = response.stream();
      if (!stream) {
        return res
          .status(500)
          .json(new ApiResponse(500, null, 'Failed to get audio stream'));
      }

      console.log('TTS: Audio stream received, starting to stream to client...');

      // Set response headers for audio streaming
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream the audio directly to the client
      const reader = stream.getReader();
      let totalBytes = 0;
      let chunkCount = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`TTS: Stream complete after ${chunkCount} chunks`);
            break;
          }
          
          if (value && value.length > 0) {
            totalBytes += value.length;
            chunkCount++;
            res.write(value);
            
            // Log progress every 10 chunks
            if (chunkCount % 10 === 0) {
              console.log(`TTS: Streamed ${chunkCount} chunks, ${totalBytes} bytes so far...`);
            }
          } else {
            console.warn('TTS: Received empty chunk');
          }
        }
        
        console.log(`TTS: Successfully streamed ${totalBytes} bytes (${chunkCount} chunks) of audio`);
        
        if (totalBytes === 0) {
          console.error('TTS: ERROR - No audio data was streamed! This will cause playback failure.');
        }
      } catch (streamError) {
        console.error('TTS: Error during streaming:', streamError);
        throw streamError;
      } finally {
        reader.releaseLock();
        res.end();
        console.log('TTS: Response ended');
      }

    } catch (error: any) {
      console.error('Error generating text-to-speech:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        body: error.body,
        stack: error.stack
      });
      
      if (!res.headersSent) {
        res
          .status(500)
          .json(new ApiResponse(500, null, `Text-to-speech generation failed: ${error.message}`));
      } else {
        // Headers already sent, can only log the error
        console.error('TTS: Cannot send error response, headers already sent');
        res.end();
      }
    }
  }
);
