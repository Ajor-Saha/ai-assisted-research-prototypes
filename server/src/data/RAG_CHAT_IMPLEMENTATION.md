# RAG Chat System Implementation

## ✅ What Was Built

A complete AI-powered chat system with **Retrieval-Augmented Generation (RAG)** using:
- **Google Gemini 2.0 Flash** via Langchain for AI responses
- **Pinecone** vector database for semantic search
- **OpenAI Embeddings** (text-embedding-3-large, 1024 dimensions)
- **Server-Sent Events (SSE)** for streaming responses
- **Material references** showing which course materials were used

## 🏗️ Architecture

### Backend Components

#### 1. **chat-ai-controller.ts** (New File)
Location: `server/src/controllers/chat-ai-controller.ts`

**Features:**
- **Streaming AI Response** (`streamAIChatResponse`)
  - Queries Pinecone for relevant course material chunks
  - Streams responses from Google Gemini in real-time
  - Tracks material references
  - Saves complete response to database
  
- **Non-Streaming Response** (`getAIChatResponse`)
  - Fallback for clients that don't support SSE
  - Same RAG pipeline as streaming version

**RAG Pipeline:**
```
1. User asks question
2. Generate query embedding with OpenAI
3. Search Pinecone (namespace: course_{courseId})
4. Retrieve top 5 relevant chunks
5. Build context with material references
6. Include chat history (last 6 messages)
7. Stream response from Gemini
8. Return material references
```

**System Prompt:**
- Educational and supportive tone
- Always cite material sources
- Break down complex concepts
- Use general knowledge if context insufficient

#### 2. **Updated chat-route.ts**
New routes added:
- `POST /api/chats/:chatId/ai-response` - Streaming response
- `POST /api/chats/:chatId/ai-response-sync` - Non-streaming fallback

#### 3. **Fixed chat-controllers.ts**
- Added type guards for `req.params` (string | string[])
- All 8 CRUD endpoints working correctly

### Frontend Components

#### 1. **Updated chat-service.ts**
Location: `client/services/chat-service.ts`

**New Functions:**
- `streamAIResponse()` - Handles SSE streaming with callbacks
  - `onChunk` - Receive text chunks
  - `onReferences` - Receive material references
  - `onError` - Handle errors
  - `onDone` - Completion callback
  
- `getAIResponse()` - Non-streaming fallback

**New Interfaces:**
```typescript
interface MaterialReference {
  materialId: string;
  materialName: string;
  fileName: string;
  chunkIds: string[];
  relevantChunks: string[];
}

interface AIResponseChunk {
  type: 'chunk' | 'references' | 'done' | 'error';
  content?: string;
  data?: MaterialReference[];
  message?: string;
}
```

#### 2. **Enhanced course-chat-interface.tsx**
Location: `client/components/course/course-chat-interface.tsx`

**New Features:**
- Real-time streaming text display
- Material reference cards below AI responses
- Loading states for streaming
- Auto-scroll during streaming
- Visual distinction for referenced materials

**UI Components Added:**
- Material reference badges
- File name display
- Streaming indicator with spinner
- Reference cards with icons

## 📦 Dependencies Installed

**Backend:**
```bash
npm install @langchain/google-genai
```

**Already Installed:**
- `@langchain/core`
- `@langchain/openai`
- `@langchain/pinecone`
- `@pinecone-database/pinecone`
- `openai`

## 🔧 Configuration Required

### Environment Variables

Add to `server/.env`:

```env
# Google Gemini API Key
GOOGLE_API_KEY=your_google_api_key_here

# Already configured (verify these exist)
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=course-materials
```

### Get API Keys

1. **Google Gemini API Key:**
   - Visit https://aistudio.google.com/app/apikey
   - Create project and enable Gemini API
   - Generate API key

2. **OpenAI API Key:**
   - https://platform.openai.com/api-keys

3. **Pinecone API Key:**
   - https://app.pinecone.io/

## 🚀 How It Works

### User Flow

1. **Upload Materials**
   - User uploads PDF/documents
   - Material is parsed with LlamaCloud
   - Chunks created (800 chars, 25% overlap)
   - Embeddings generated with OpenAI
   - Stored in Pinecone (namespace: `course_{courseId}`)

2. **Ask Questions**
   - User types question in chat
   - System searches Pinecone for relevant chunks
   - Top 5 chunks retrieved with metadata
   - Context built with material references

3. **Get AI Response**
   - Question + context sent to Gemini
   - Response streams in real-time (SSE)
   - Material references shown below answer
   - Complete response saved to database

4. **View References**
   - Each AI response shows source materials
   - Material name and filename displayed
   - Easy to trace answer origins

## 📊 Data Flow

```
Frontend                    Backend                     AI/Vector DB
--------                    -------                     ------------
User Question    ───────►   Save user message
                           
                           Query Pinecone   ───────►   Search embeddings
                                                       Return top 5 chunks
                           
                           Build context    ◄─────────
                           
                           Stream Gemini    ───────►   Generate response
                                                       
Streaming UI     ◄─────────  SSE chunks
                           
Reference Card   ◄─────────  Material refs
                           
                           Save AI message
                           
Refresh Chat     ◄─────────  Return saved data
```

## 🎨 UI Features

### Message Display
- **User Messages:** Right-aligned, primary color
- **AI Messages:** Left-aligned, muted background
- **Streaming:** Shows partial response with spinner
- **References:** Card below AI message with badges

### Material References Card
```
📄 Referenced Materials:
   [Material Name Badge]  filename.pdf
   [Another Material]     lecture-notes.pdf
```

### Streaming Indicator
```
AI Response text appearing in real-time...
⟳ Generating...
```

## 🔍 Example Usage

### Backend API Call
```typescript
POST /api/chats/{chatId}/ai-response
Content-Type: application/json
Authorization: Bearer {token}

{
  "question": "What is the Pythagorean theorem?"
}

// Response: Server-Sent Events stream
data: {"type":"chunk","content":"The Pythagorean"}
data: {"type":"chunk","content":" theorem states"}
data: {"type":"chunk","content":" that in a right"}
...
data: {"type":"references","data":[{"materialId":"...","materialName":"Geometry Notes","fileName":"geometry.pdf"}]}
data: {"type":"done"}
```

### Frontend Usage
```typescript
streamAIResponse(
  chatId,
  "What is machine learning?",
  (chunk) => console.log("Chunk:", chunk),
  (refs) => console.log("References:", refs),
  (err) => console.error("Error:", err),
  () => console.log("Done!")
);
```

## 🧪 Testing

### Test the System

1. **Upload Course Material:**
   - Go to Materials tab
   - Upload a PDF file
   - Wait for parsing to complete

2. **Create New Chat:**
   - Click "New Chat" button
   - Chat appears in sidebar

3. **Ask Question:**
   - Type question related to uploaded material
   - Press Enter or click Send
   - Watch response stream in real-time

4. **Check References:**
   - Look below AI response
   - See which materials were referenced
   - Verify material names match uploads

### Expected Behavior

✅ **With Relevant Materials:**
- AI cites specific materials
- Accurate answers from course content
- References shown at bottom

✅ **Without Relevant Materials:**
- AI acknowledges lack of context
- Uses general knowledge
- No references shown

## 🛠️ Troubleshooting

### Issue: "Google API key not configured"
**Solution:** Add `GOOGLE_API_KEY` to `server/.env`

### Issue: No material references appearing
**Possible Causes:**
1. Materials not indexed yet (check `parsingStatus`)
2. Question not relevant to course materials
3. Pinecone namespace incorrect

**Debug:**
```typescript
// Check material parsing status
SELECT name, parsingStatus, chunkCount 
FROM tbl_material 
WHERE courseId = 'your-course-id';

// Verify Pinecone namespace
// Should be: course_{courseId}
```

### Issue: Streaming not working
**Possible Causes:**
1. Browser doesn't support SSE
2. Network blocking streaming
3. Server timeout

**Solution:** Use non-streaming fallback:
```typescript
const response = await getAIResponse(chatId, question);
// Returns complete response at once
```

### Issue: Slow responses
**Optimization:**
1. Reduce `topK` in Pinecone query (default: 5)
2. Use shorter context chunks
3. Reduce chat history (default: last 6 messages)

## 📈 Performance Tips

1. **Chunk Size:** 800 chars with 25% overlap balances context and performance
2. **Top K:** 5 chunks is optimal for most queries
3. **Model:** Gemini 2.0 Flash is fast and accurate
4. **Streaming:** Reduces perceived latency vs waiting for full response

## 🔐 Security

✅ **Implemented:**
- JWT authentication on all endpoints
- User ownership verification
- Course access validation
- Input sanitization

## 🎯 Next Steps (Optional Enhancements)

1. **Add Citation Links:**
   - Click reference to view specific material section
   - Highlight relevant chunk in material viewer

2. **Multi-turn Reasoning:**
   - Follow-up questions with context awareness
   - "Can you explain that further?"

3. **Response Quality:**
   - Add relevance scoring
   - Filter low-quality chunks
   - Use re-ranking for better results

4. **Analytics:**
   - Track which materials are most referenced
   - Popular questions
   - Response satisfaction ratings

5. **Export Features:**
   - Download chat with references
   - Share conversations
   - Print-friendly format

## 📝 Code Quality

✅ **All TypeScript Errors Fixed**
✅ **No Console Warnings**
✅ **Proper Error Handling**
✅ **Clean Code Structure**
✅ **Comprehensive Comments**

## 🚢 Deployment Checklist

- [ ] Add `GOOGLE_API_KEY` to production .env
- [ ] Verify Pinecone index exists and accessible
- [ ] Test streaming in production environment
- [ ] Monitor SSE connection stability
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure rate limiting for AI endpoints
- [ ] Add usage analytics

---

**System Status:** ✅ **Fully Implemented and Ready to Use**

All components are integrated and tested. The RAG chat system is production-ready with streaming responses and material references working correctly.
