# Fazz Code

> AI-powered web app generator with multi-agent system, live preview, and one-click deploy.

🌐 **Live**: [fazcode.sangtech.biz.id](https://fazcode.sangtech.biz.id)

---

## ✨ Features

### 🤖 Multi-Agent AI Pipeline
- **Planner** — Analyzes user prompt, outputs structured JSON plan (files, components, architecture)
- **Generator** — Generates production-ready code using Claude/GPT/Gemini
- **Fixer** — Self-heal loop that detects and fixes build/type errors automatically
- **Reviewer** — Cross-model code review (e.g., Claude generates → GPT reviews)

### 💬 AI Chat Interface
- Streaming responses with markdown + syntax highlighting
- Multi-model support: Claude Sonnet 4, GPT-4o, Gemini 2.0 Flash
- Token tracking with cost estimation per message
- Stop/cancel generation with AbortController

### 📝 Code Editor
- Monaco Editor (VS Code engine) with full IntelliSense
- Multi-tab support with file modification indicators
- **Diff view** — Side-by-side comparison with accept/reject per file
- File tree with expand/collapse navigation

### 🖥️ Live Preview
- WebContainer-based sandbox (in-browser Node.js runtime)
- Device presets: Desktop, Tablet, Mobile
- Real-time file sync from editor to preview
- Auto boot + dependency install + dev server

### 🔐 Authentication
- Better Auth with PostgreSQL backend
- Email/password sign-up & login
- GitHub OAuth (optional)
- Session management with 7-day expiry
- Rate limiting (30 req/min per user)

### 💾 Project Persistence
- Full CRUD for projects, files, messages, and versions
- PostgreSQL database with proper relations and indexes
- Auto-save on changes, auto-load on navigation

### 📜 Version History
- Save snapshots of project state at any point
- Restore to any previous version
- Version descriptions for tracking changes

### 🎨 Project Templates
- **Blank** — Start from scratch
- **Landing Page** — Hero, features, CTA sections
- **Admin Dashboard** — Sidebar, stats cards, data table
- **Blog** — Post list with detail pages

### ⌨️ Command Palette
- `⌘K` / `Ctrl+K` to open
- Search files, projects, and actions
- Keyboard navigation

### 📱 Responsive Design
- Desktop: Three-pane resizable layout (Chat | Editor | Preview)
- Mobile: Tab switcher for Chat, Editor, Preview
- Collapsible panels

### 🔄 Agent Status Panel
- Visual pipeline progress: Plan → Generate → Fix → Review
- Real-time stage indicators with animations
- Error count badge

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI SDK | Vercel AI SDK (streamText, generateText) |
| Editor | Monaco Editor (@monaco-editor/react) |
| Sandbox | WebContainers (@webcontainer/api) |
| Auth | Better Auth |
| Database | PostgreSQL 16 |
| State | Zustand |
| Durable Execution | Inngest (scaffolded) |
| Process Manager | PM2 |
| Reverse Proxy | Apache + Let's Encrypt SSL |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- (Optional) GitHub OAuth app for social login

### 1. Clone & Install
```bash
git clone https://github.com/mfazri10/fazz-code.git
cd fazz-code
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# AI Provider (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Database
DATABASE_URL=postgresql://user:password@localhost:5433/fazzcode

# Auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 3. Database Setup
```bash
# Create database
createdb fazzcode

# Run migration
psql -d fazzcode -f supabase/migrations/001_initial_schema.sql
```

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Production Deploy

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## 📁 Project Structure

```
fazz-code/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...all]/    # Better Auth API
│   │   │   ├── chat/             # AI chat streaming endpoint
│   │   │   ├── generate/         # Agent pipeline endpoint
│   │   │   ├── inngest/          # Inngest durable functions
│   │   │   └── projects/         # CRUD API for projects
│   │   ├── login/                # Login page
│   │   ├── project/[id]/         # Project workspace
│   │   └── workspace/            # Project list + three-pane layout
│   ├── components/
│   │   ├── agent-status.tsx      # Pipeline progress indicator
│   │   ├── chat-panel.tsx        # AI chat interface
│   │   ├── command-palette.tsx   # ⌘K command palette
│   │   ├── editor-panel.tsx      # Monaco editor + diff view
│   │   ├── file-tree.tsx         # File explorer sidebar
│   │   ├── preview-panel.tsx     # WebContainer preview
│   │   ├── user-menu.tsx         # Auth user dropdown
│   │   ├── version-history.tsx   # Version snapshots UI
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── agent-loop.ts         # Code generator with parser
│   │   ├── agent-network.ts      # Client-side agent orchestrator
│   │   ├── auth.ts               # Better Auth server config
│   │   ├── auth-client.ts        # Better Auth browser client
│   │   ├── auth-server.ts        # Server-side auth helpers
│   │   ├── db.ts                 # PostgreSQL query helpers
│   │   ├── fixer-agent.ts        # Self-heal error fixer
│   │   ├── model-gateway.ts      # Multi-provider AI gateway
│   │   ├── planner-agent.ts      # Prompt → structured plan
│   │   ├── reviewer-agent.ts     # Cross-model code review
│   │   ├── templates.ts          # Project starter templates
│   │   └── webcontainer.ts       # WebContainer management
│   └── stores/
│       └── project-store.ts      # Zustand global state
├── supabase/
│   └── migrations/               # SQL schema
├── ecosystem.config.js            # PM2 config
└── middleware.ts                   # Auth middleware
```

---

## 🔒 Security

- All API endpoints require authentication (Better Auth sessions)
- Rate limiting on chat endpoint (30 req/min per user)
- Input validation on all API routes
- iframe sandbox without `allow-same-origin`
- Agent pipeline runs server-side (API keys never exposed to client)
- Environment variables validated at build time

---

## 📄 License

MIT © Fazri
