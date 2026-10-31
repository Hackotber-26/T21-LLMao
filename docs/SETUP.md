# SOLVYN – Developer Setup Guide

Welcome to the Solvyn project repository. This guide will walk you through setting up your local environment, applying database migrations, and configuring environment variables.

---

## 1. Quick Start

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm
- A Supabase account and project (Free tier)
- Groq API key (optional for local mock mode, required for live AI classification)

### Clone & Install
```bash
git clone https://github.com/Hackotber-26/T21-LLMao.git
cd T21-LLMao
npm install
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the required keys in `.env.local`:
```ini
# Supabase Configuration (From Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Groq AI Configuration (From console.groq.com)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

> **Security Note**: Never commit `.env.local` to GitHub. It is already in `.gitignore`. The `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are only accessible server-side.

---

## 3. Database Setup (Supabase)

To execute the database schema and triggers:

1. Open your **Supabase Dashboard** -> Select your Project.
2. Navigate to the **SQL Editor** tab (left sidebar).
3. Run the migrations in sequential order by copying the contents of each file from the `supabase/migrations/` directory:
   - **Step 1**: Run `supabase/migrations/001_initial_schema.sql` (Creates tables, foreign keys, and indexes)
   - **Step 2**: Run `supabase/migrations/002_rls_policies.sql` (Enables Row-Level Security and creates access policies)
   - **Step 3**: Run `supabase/migrations/003_functions_triggers.sql` (Creates triggers for auto-profiles, report counts, and like counts)
4. Click **Run**.

---

## 4. Running the Development Server

```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

---

## 5. Team Integration Architecture

- **Member 1 (Frontend)**: Consume `GET /api/problems`, `GET /api/problems/[id]`, and `POST /api/reports`. Check `docs/API_CONTRACTS.md` for schemas.
- **Member 2 (Backend Lead)**: Maintains migrations, database integrity, and core endpoints.
- **Member 3 (AI Engineer)**: The AI service interface is located in `src/lib/services/ai.service.ts`. Plug in custom Groq logic or fine-tuned prompts directly there.
- **Member 4 (Solutions & Social)**: Consume `POST /api/solutions`, `GET /api/solutions/[id]`, `POST /api/solutions/[id]/like`, and `GET /api/profile/[username]`.
