# CourseWise - AI-Powered Study Assistant

This is a full-stack AI-powered course management and personalized study assistant built with Next.js and Express.

## Project Structure

- `/client` - Next.js 16+ frontend with App Router
- `/server` - Express.js backend with TypeScript

---

## Global Coding Standards

### TypeScript
- Enable strict mode in all TypeScript configurations
- Define explicit return types for all functions and methods
- Use type inference only when the type is immediately obvious
- Prefer `interface` for object shapes, `type` for unions/aliases
- Use `satisfies` operator for type validation without widening
- Avoid `any` - use `unknown` with proper type guards instead

### Code Style
- Use meaningful variable names (no single-letter variables except in loops)
- Keep functions under 50 lines; extract logic into smaller functions
- Avoid nested conditionals deeper than 3 levels
- Use early returns to reduce nesting
- No commented-out code in committed files
- No `console.log` in production code; use proper logging utilities

### Error Handling
- All async operations must have try-catch blocks
- Always handle Promise rejections
- Use custom error classes for domain-specific errors
- Include error context (operation, entity, relevant IDs)

---

## Frontend (`/client`) Guidelines

### Next.js App Router
- Use Server Components by default; mark Client Components with `"use client"`
- Keep Client Components as leaf nodes in the component tree
- Use `async/await` in Server Components for data fetching
- Leverage Next.js built-in caching and revalidation strategies
- Use `loading.tsx` and `error.tsx` for route-level loading/error states

### React Components
- Use functional components with hooks exclusively
- Component file naming: `PascalCase.tsx` (e.g., `CourseCard.tsx`)
- Hook file naming: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- One component per file, except for tightly related sub-components
- Co-locate styles, tests, and types with components when possible

### State Management (Zustand)
- Create one store per domain (auth, courses, chat, etc.)
- Store files: `store/<domain>Store.ts`
- Use `immer` middleware for immutable updates
- Split large stores into slices with `create` from `zustand`
- Persist only necessary state to localStorage

### Forms (React Hook Form + Zod)
- Define Zod schemas in `schemas/` directory
- Use `zodResolver` for form validation
- Reusable form components go in `components/form/`
- Handle form errors with `formState.errors` and display inline
- Use `useFormContext` for complex nested forms

### UI Components (Radix + Tailwind)
- Base components in `components/ui/` (shadcn/ui pattern)
- Use `cn()` utility from `class-variance-authority` for conditional classes
- Follow Tailwind v4 syntax (no `@apply` in components)
- Use CSS variables for theming (dark mode support)
- Keep Tailwind classes grouped: layout → spacing → colors → effects

### Styling
- Use Tailwind utility classes exclusively
- Extract repeated patterns into component variants with CVA
- Use CSS custom properties for dynamic values
- Dark mode: use `dark:` prefix and CSS variables

### API Integration
- Create service functions in `services/` directory
- Use Axios instances with interceptors for auth headers
- Handle API errors uniformly; transform to UI-friendly messages
- Use React Query or SWR for server state when needed

---

## Backend (`/server`) Guidelines

### Express.js Structure
```
src/
├── config/          # Configuration (DB, env, etc.)
├── controllers/     # Request handlers (11 files currently)
├── db/             # Drizzle ORM schema & migrations
├── middleware/     # Express middleware (auth, error handling)
├── routes/         # Route definitions (7 modules)
├── types/          # TypeScript type definitions
├── utils/          # Helper functions
└── index.ts        # Entry point
```

### Controllers
- One controller per resource/domain
- Handler functions: `async (req, res, next) => { ... }`
- Extract validation logic to middleware
- Return consistent response format:
  ```typescript
  { success: boolean, data?: T, error?: string, message?: string }
  ```
- Use HTTP status codes correctly (200, 201, 400, 401, 404, 500)

### Routes
- Define routes in `routes/` directory
- Use express.Router() for modularity
- Apply middleware at route level (auth, validation)
- Route naming: RESTful conventions
  - `GET /api/courses` - list
  - `GET /api/courses/:id` - get one
  - `POST /api/courses` - create
  - `PATCH /api/courses/:id` - update
  - `DELETE /api/courses/:id` - delete

### Database (Drizzle ORM + Neon PostgreSQL)
- Schema definitions in `db/schema.ts` or domain-specific files
- Use Drizzle Kit for migrations: `db:generate`, `db:migrate`
- Define relations explicitly with Drizzle relations
- Use transactions for multi-table operations
- Index frequently queried columns

### Authentication & Security
- JWT tokens in HTTP-only cookies
- Hash passwords with bcrypt (10+ rounds)
- Validate all inputs with Zod schemas
- Sanitize user inputs to prevent injection
- Use CORS configuration for client origin only
- Rate limit sensitive endpoints

### AI/LLM Integration (LangChain)
- Abstract LLM calls into service functions
- Support multiple providers (OpenAI, Google GenAI) via unified interface
- Use Pinecone for vector storage and retrieval
- Implement proper RAG patterns with context chunking
- Handle API failures gracefully with fallbacks
- Log AI usage for monitoring

### File Handling (AWS S3)
- Use presigned URLs for direct client uploads when possible
- Validate file types and sizes before upload
- Store file metadata in database, file content in S3
- Implement virus scanning for uploaded files

### Real-time (Socket.io)
- Namespace rooms by course/chat for isolation
- Authenticate socket connections on connection
- Handle reconnection and state sync
- Emit events in controllers after DB operations

### Environment Variables
- All secrets in `.env` (never commit)
- Use `process.env` with validation on startup
- Create `.env.example` with dummy values for documentation

---

## Testing Standards

### Frontend
- Component tests: React Testing Library
- Hook tests: `renderHook` from RTL
- Mock API calls with MSW (Mock Service Worker)
- Test user interactions, not implementation details

### Backend
- Unit tests for utilities and services
- Integration tests for API endpoints (Supertest)
- Mock external services (AI APIs, S3, email)
- Use test database (separate Neon project or SQLite)

---

## Git & Commit Standards

### Commit Messages
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(courses): add file upload to course materials`
- `fix(auth): resolve JWT expiration handling`
- `refactor(chat): extract message processing to service`

### Branching
- `main` - production-ready code
- `develop` - integration branch
- `feature/<name>` - new features
- `fix/<name>` - bug fixes
- `hotfix/<name>` - urgent production fixes

---

## Documentation

- Document all public functions with JSDoc
- Include parameter types and return values
- Add `@throws` for functions that throw errors
- Document environment variables in README
- Keep API documentation updated (OpenAPI/Swagger)

---

## Performance Guidelines

### Frontend
- Use Next.js Image component for optimized images
- Lazy load components below the fold with `dynamic()`
- Debounce search inputs and scroll handlers
- Use React.memo for expensive pure components
- Monitor bundle size; code split by route

### Backend
- Add database indexes for slow queries
- Use Redis for caching frequently accessed data
- Implement pagination for list endpoints (cursor-based for large datasets)
- Compress API responses
- Use connection pooling for database

---

## AI/ML Specific Guidelines

- Never expose raw LLM prompts to users
- Sanitize user inputs before sending to AI APIs
- Implement rate limiting on AI endpoints
- Cache AI responses when appropriate
- Log AI token usage for cost monitoring
- Handle AI hallucinations with validation layers
- Provide feedback mechanisms for AI-generated content
