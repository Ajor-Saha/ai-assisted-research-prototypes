# CourseWise Assistant

An AI-powered learning platform that combines course management, interactive study tools, exam workflows, and personalized AI assistance.

CourseWise is organized as a full-stack monorepo with a modern web client and a TypeScript API server.

## Project Overview

CourseWise helps learners and instructors:

- Manage courses, topics, and study materials
- Chat with AI assistants for math, research, and text-based support
- Create and manage exam patterns, sessions, and results
- Build personalized study paths
- Track learning performance and analytics

## Monorepo Layout

    p-2-all-prototypes/
    |- client/   # Next.js frontend application
    |- server/   # Express + TypeScript backend API
    |- AGENTS.md # Engineering conventions and project standards

## Architecture

### High-Level Flow

    Browser (Next.js App)
         |
         | HTTP + Cookies + Bearer Token
         v
    Express API Server
         |
         | Drizzle ORM
         v
    Neon PostgreSQL

### Frontend (client)

- Framework: Next.js 16 (App Router) + React 19 + TypeScript
- UI System: Tailwind CSS v4 + Radix UI + shadcn-style component structure
- State Management: Zustand stores by domain
- Forms and Validation: React Hook Form + Zod
- HTTP Client: Axios with auth interceptors
- Visualization and rendering: Recharts, Mermaid, KaTeX/Markdown rendering

Main frontend domains:

- app routing: application and admin route groups
- reusable UI: components/ui
- domain modules: course, learning, analytics, ai-assistants
- data contracts: schemas and typed services

### Backend (server)

- Runtime: Node.js + Express + TypeScript
- Database: PostgreSQL (Neon) with Drizzle ORM and migrations
- Auth: JWT + cookies + middleware-driven route protection
- Real-time: Socket.io
- Storage integration: AWS SDK-based object storage integration (R2-compatible configuration)
- AI integrations: LangChain, OpenAI, Google GenAI, Pinecone, Llama Cloud

API domains include:

- auth
- courses
- topics
- materials
- chats and math-chats
- research-papers
- exam-patterns, generated-exams, exam-sessions, exam-results
- study-paths

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- Zustand
- React Hook Form + Zod
- Axios

### Backend

- Express 4
- TypeScript 5
- Drizzle ORM + Drizzle Kit
- PostgreSQL (Neon)
- Socket.io
- JWT + bcryptjs
- LangChain + OpenAI + Google GenAI + Pinecone

## Getting Started

## 1) Prerequisites

- Node.js 20+
- pnpm (for frontend) and npm (for backend), or standardize to one package manager
- PostgreSQL connection string (Neon recommended)

## 2) Install Dependencies

Frontend:

    cd client
    pnpm install

Backend:

    cd server
    npm install

## 3) Environment Setup

Backend:

- Copy server/.env.example to server/.env
- Fill database, auth, mail, storage, and AI provider keys

Frontend:

- Set NEXT_PUBLIC_BACKEND_BASE_URL (defaults to http://localhost:8000)

## 4) Run in Development

Backend:

    cd server
    npm run dev

Frontend:

    cd client
    pnpm dev

Default local URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Database Workflow

Run from server directory:

    npm run db:generate
    npm run db:migrate
    npm run db:studio

## Engineering Notes

- Coding standards and architecture guidance live in AGENTS.md
- Frontend and backend follow strict TypeScript-first conventions
- API routes are modularized by domain and mounted under /api/*

## Current Project Status Snapshot

This repository already includes:

- A production-style frontend structure with domain-driven components
- A multi-domain backend API with modular routes/controllers
- Drizzle migration history and database tooling
- AI-ready integrations for chat, study support, and content workflows

## Next Improvements (Optional)

- Add a root-level workspace package manager strategy (single lockfile workflow)
- Add root scripts for one-command local startup
- Add testing and CI sections to this README as tests are finalized
- Add architecture diagram images in docs/ for onboarding
