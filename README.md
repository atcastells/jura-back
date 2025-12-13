# Personal AI Career Agent (Backend API)

A personal AI agent that presents your professional history, answers recruiters’ questions, and adapts to context and style.

> **Note**: This is the backend repository for the Jura project.

## 📖 Description

This project provides professionals with a personal AI agent that encapsulates their entire career history. Users can upload CVs or provide conversational updates, generating public links with customizable context and tone. Recruiters can query the agent in natural language, receiving precise, role- or company-specific answers. The agent ensures consistent, accurate, and professional presentation while giving users full control over what is shared.

## ✨ Features

- **Knowledge Base**: Upload CVs and documents to build your agent’s knowledge.
- **Contextual Adaptation**: Generate public links with customizable context and personalities.
- **Recruiter Q&A**: Natural-language Q&A interface for recruiters (API support).
- **Privacy Control**: Full control over what is shared.
- **Professional Presentation**: Ensures accurate and consistent representation of your career.

## 🛠 Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express 5
- **Architecture**: Hexagonal (Ports & Adapters)
- **AI / LLMs**: Gemini, LangChain
- **Vector Store**: Supabase (pgvector), MongoDB Atlas (Document Store)
- **Authentication**: Supabase Auth
- **DI Container**: TypeDI
- **API Docs**: Scalar + OpenAPI 3.1
- **Testing**: Jest

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start development server
pnpm run dev
```

Server runs at `http://localhost:3000`

## 📚 API Documentation

| Endpoint        | Description                   |
| --------------- | ----------------------------- |
| `/docs`         | Interactive API docs (Scalar) |
| `/openapi.json` | OpenAPI specification         |
| `/health`       | Health check                  |

## 📡 Key Endpoints

### Core Capabilities

| Method | Endpoint          | Description                                      |
| ------ | ----------------- | ------------------------------------------------ |
| POST   | `/api/v1/ingest`  | Upload and vectorize career documents (PDF/Text) |
| POST   | `/api/v1/chat`    | Main interface for recruiters to ask questions   |
| GET    | `/api/v1/context` | View what the AI "knows" about your career       |

_(See `/docs` for the full OpenAPI specification)_

## 🗺 Roadmap (MVP)

- **Focus**: Personal career representation and recruiter interaction.
- **Exclusions**: Job application automation, recruiter dashboards, skill testing, social networking, team accounts, payments.

### Implementation Status

- [x] Express server & Architecture setup
- [x] Authentication (Supabase)
- [x] Document Ingestion (PDF upload)
- [x] Vector Store integration (Supabase)
- [ ] Text extraction & Chunking
- [ ] RAG Pipeline implementation
- [ ] Contextual Chat Endpoint
- [ ] Recruiter Analytics

## 📁 Project Structure

```
src/
├── adapters/
│   ├── inbound/        # API Controllers (Express)
│   └── outbound/       # External services (Supabase, Gemini, MongoDB)
├── domain/             # Business logic & entities
├── application/        # Use cases (Orchestration)
└── infrastructure/     # Configuration & Setup
```

## 🔐 Environment Variables

See `.env.example` for required variables:

- `MONGO_URI` - MongoDB Atlas connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (for admin tasks)
- `PORT` - Server port (default: 3000)

## 📄 License

[Specify license here]
