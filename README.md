# Jura API

> AI-powered career document analysis and recruiter interaction platform

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env /en

# Start development server
pnpm run dev
```

Server runs at `http://localhost:3000`

## 📚 API Documentation

| Endpoint | Description |
|----------|-------------|
| `/docs` | Interactive API docs (Scalar) |
| `/openapi.json` | OpenAPI specification |
| `/health` | Health check |

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js + TypeScript |
| **Framework** | Express 5 |
| **Architecture** | Hexagonal (Ports & Adapters) |
| **Database** | MongoDB Atlas |
| **Auth** | Supabase |
| **AI/LLM** | Google Gemini via LangChain |
| **DI Container** | TypeDI |
| **API Docs** | Scalar + OpenAPI 3.1 |
| **Testing** | Jest |
| **Linting** | ESLint + Prettier |

## 📡 API Endpoints

### Core Endpoints

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ⬜ TODO | POST | `/api/v1/ingest` | Upload and vectorize career documents |
| ⬜ TODO | POST | `/api/v1/chat` | Main interface for recruiters to ask questions |
| ⬜ TODO | GET | `/api/v1/context` | View what the AI "knows" about your career |
| ⬜ TODO | GET | `/api/v1/analytics` | Insights into recruiter interactions |

### Infrastructure Endpoints

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ Done | GET | `/health` | Health check |
| ✅ Done | GET | `/docs` | API documentation |
| ✅ Done | GET | `/openapi.json` | OpenAPI spec |

## ✅ Features Roadmap

### Infrastructure
- [x] Express server setup
- [x] MongoDB Atlas connection
- [x] Hexagonal architecture
- [x] TypeDI dependency injection
- [x] API documentation (Scalar)
- [x] Health check endpoint
- [x] CORS configuration
- [x] Authentication (Supabase)
- [ ] Rate limiting
- [ ] Request validation

### Document Ingestion
- [ ] PDF upload endpoint
- [ ] Text extraction
- [ ] Document chunking
- [ ] Vector embeddings (Gemini)
- [ ] Vector storage

### Chat Interface
- [ ] Chat endpoint
- [ ] Context retrieval (RAG)
- [ ] Conversation history
- [ ] Streaming responses

### Analytics
- [ ] Interaction logging
- [ ] Analytics dashboard data
- [ ] Query insights

### AI/LLM
- [x] Gemini adapter
- [x] LangChain integration
- [x] LangGraph agent setup
- [ ] Tool registry for agents
- [ ] RAG pipeline

## 🧪 Scripts

```bash
pnpm run dev          # Start dev server with hot reload
pnpm run build        # Build for production
pnpm run start        # Run production build
pnpm run test         # Run tests
pnpm run lint         # Lint code
pnpm run lint:fix     # Fix lint issues
pnpm run format       # Format code with Prettier
```

## 📁 Project Structure

```
src/
├── adapters/
│   ├── inbound/
│   │   ├── http/           # Express routes & middleware
│   │   └── primary/        # Agent factories
│   └── outbound/
│       ├── external-services/  # Gemini, LangChain adapters
│       └── persistence/        # MongoDB adapter
├── domain/                 # Business logic & entities
├── ports/                  # Interfaces (ports)
└── infrastructure/         # Server, config, OpenAPI spec
```

## 🔐 Environment Variables

See `.env.example` for required variables:
- `MONGO_URI` - MongoDB Atlas connection string
- `MONGO_DB` - Database name
- `GEMINI_API_KEY` - Google Gemini API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `PORT` - Server port (default: 3000)
