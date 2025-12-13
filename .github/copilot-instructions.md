# GitHub Copilot Instructions for jura-back

This repository contains a Node.js backend application for a Personal AI Career Agent using **hexagonal architecture** (ports & adapters pattern). Built with TypeScript, Express.js, Drizzle ORM, and AI capabilities via Gemini and LangChain.

## Project Overview

**Purpose**: A personal AI agent that presents professional history, answers recruiters' questions, and adapts to context and style.

**Key Features**:
- Knowledge Base: Upload CVs and documents
- RAG Pipeline: Vector search with Supabase pgvector
- Contextual AI Chat: Natural-language Q&A for recruiters
- Authentication: Supabase Auth
- Vector embeddings: Gemini text-embedding-004 (768-dimensional)

## Architecture

This project follows **Hexagonal Architecture (Ports & Adapters)**:

```
src/
├── adapters/         # Interface adapters (controllers, repositories)
│   ├── inbound/      # HTTP controllers, middlewares, routes
│   └── outbound/     # External services (Supabase, Gemini, MongoDB)
├── domain/           # Business logic, entities, and port interfaces
├── application/      # Use cases (orchestration layer)
└── infrastructure/   # Configuration, server setup, DI container
```

**Key Principles**:
- Domain logic is isolated from infrastructure concerns
- Dependencies flow inward (domain has no dependencies on outer layers)
- Use ports (interfaces) in domain, adapters implement them
- Business logic lives in use cases, not controllers

## Development Setup

### Package Manager
**ALWAYS use `pnpm`** for all package operations:
```bash
pnpm install          # Install dependencies
pnpm add <package>    # Add a dependency
pnpm add -D <package> # Add a dev dependency
```

### Commands
```bash
pnpm dev              # Start development server with hot reload
pnpm build            # Compile TypeScript to JavaScript
pnpm start            # Run production build
pnpm lint             # Check for linting errors
pnpm lint:fix         # Fix linting errors automatically
pnpm format           # Format code with Prettier
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure required variables (MONGO_URI, GEMINI_API_KEY, SUPABASE_URL, etc.)
3. Run `pnpm install`

## Code Style & Conventions

### General
- Use TypeScript strict mode
- Use ES modules (`import`/`export`, not `require`)
- File extensions: Use `.js` in imports (TypeScript ESM convention)
- No default exports; use named exports
- Run `pnpm lint` and `pnpm format` before committing

### Naming Conventions
- Use PascalCase for classes, interfaces, types
- Use camelCase for functions, variables
- Use SCREAMING_SNAKE_CASE for constants
- Suffix use case files with `.use-case.ts`
- Suffix test files with `.test.ts`

### Dependency Injection
- Use TypeDI `@Service()` decorator for injectable classes
- Mark injected dependencies as `readonly` in constructor parameters
- Controllers inject use cases **directly** (no string constants)
- Use cases inject repositories using string constants from `infrastructure/constants.ts`
- Example:
  ```typescript
  @Service()
  export class MyUseCase {
    constructor(
      @Inject(REPOSITORY_TOKEN)
      private readonly repository: MyRepository,
    ) {}
  }
  ```

## Error Handling

### Use HttpError for All Service-Level Errors
- **ALWAYS** use `HttpError` class for errors in use cases and controllers
- Pass errors to `next()` in controllers for centralized error handling
- Common status codes:
  - 400: Bad request / validation errors
  - 401: Unauthorized (missing/invalid auth)
  - 403: Forbidden (insufficient permissions)
  - 404: Not found
  - 500: Internal server error

### Example Pattern
```typescript
// In use cases
if (!resource) {
  throw new HttpError(404, "Resource not found");
}

if (resource.userId !== userId) {
  throw new HttpError(403, "Unauthorized to access this resource");
}

// In controllers
try {
  const result = await this.useCase.execute(data);
  response.status(200).json(result);
} catch (error) {
  next(error); // Centralized error handler will process it
}
```

## Authentication & Authorization

- Use `AuthenticatedRequest` type for authenticated routes
- **ALWAYS** verify `userId` ownership when retrieving individual resources
- Throw `HttpError(403)` for unauthorized access
- Example:
  ```typescript
  const user = (request as AuthenticatedRequest).user;
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }
  const userId = user.id;
  ```

## Validation

- Use **Zod** for input validation
- Define schemas in `src/adapters/inbound/http/middlewares/validation-schemas.ts`
- Apply validation middleware before controllers
- ValidationError returns 400 status with structured field-level errors array

## Testing

### Principles
- Write tests for all use cases in `src/application/`
- Place test files alongside source: `*.test.ts`
- Use Jest for testing
- Mock external dependencies (repositories, adapters)
- Test configuration: `jest.config.cjs` (CommonJS format for ESM project)

### Example Pattern
```typescript
describe("MyUseCase", () => {
  let useCase: MyUseCase;
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      method: jest.fn(),
    } as jest.Mocked<Repository>;

    useCase = new MyUseCase(mockRepository);
  });

  it("should do something", async () => {
    mockRepository.method.mockResolvedValue(expectedValue);
    const result = await useCase.execute(input);
    expect(result).toEqual(expected);
  });
});
```

## RAG & Vector Store

### Pipeline
1. Parse document (PDF, text)
2. Chunk text (1000 characters with 200 character overlap)
3. Generate embeddings (Gemini text-embedding-004, 768-dimensional)
4. Store in Supabase pgvector

### Security
- **ALWAYS** filter vector similarity searches by `user_id` for data isolation
- Example:
  ```typescript
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
    user_id: userId, // CRITICAL: Always include
  });
  ```

### Embeddings
- Model: `text-embedding-004`
- Dimensions: 768
- Provider: Google Gemini

## Observability

- Use OpenTelemetry for distributed tracing
- Initialize telemetry (startTelemetry) **before** all other imports in `server.ts`
- Example:
  ```typescript
  import { startTelemetry } from './telemetry.js';
  startTelemetry();
  // ... other imports
  ```

## Database

### Document Store
- MongoDB Atlas for document metadata
- Use Drizzle ORM for queries

### Vector Store
- Supabase pgvector for embeddings
- Migration files in `supabase/migrations/`

## Common Patterns

### Use Case Structure
```typescript
@Service()
export class MyUseCase {
  constructor(
    @Inject(REPOSITORY_TOKEN)
    private readonly repository: Repository,
  ) {}

  async execute(input: InputType): Promise<OutputType> {
    // 1. Validate input
    // 2. Fetch data
    // 3. Business logic
    // 4. Return result or throw HttpError
  }
}
```

### Controller Structure
```typescript
@Service()
export class MyController {
  constructor(
    private readonly useCase: UseCase,
  ) {}

  async handler(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Extract data from request
      // 2. Validate auth
      // 3. Call use case
      // 4. Return response
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

## What NOT to Do

- ❌ Don't use default exports
- ❌ Don't put business logic in controllers
- ❌ Don't access external services directly from use cases (use adapters/repositories)
- ❌ Don't forget to filter by `user_id` in vector searches
- ❌ Don't use `require()` (use ES modules)
- ❌ Don't skip error handling (always use try-catch in controllers)
- ❌ Don't forget readonly on injected dependencies
- ❌ Don't use npm or yarn (use pnpm only)

## Task Management

This project uses Linear for task tracking. When working on tasks:
1. Always work towards an existing Linear task
2. Verify task status before starting work
3. Update task status as work progresses
4. Mark tasks as Done only after verification and user approval

## Getting Help

- Check `AGENTS.md` for extended agent-specific instructions
- Review existing code in similar modules for patterns
- API documentation available at `/docs` when server is running
- OpenAPI spec at `/openapi.json`

## Before Committing

Run these checks:
```bash
pnpm lint        # Fix any linting errors
pnpm format      # Format code
pnpm test        # Ensure tests pass
pnpm build       # Verify TypeScript compiles
```
