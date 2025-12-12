# AI Coding Instructions for Scrim Planner Backend

## Architecture Overview

This project implements **Hexagonal Architecture (Ports and Adapters)** with strict separation of concerns:

- **Domain Layer** (`src/domain/`): Pure business logic, no external dependencies
  - `entities/`: Business objects (e.g., `Scrim` interface)
  - `repositories/`: Port interfaces defining data contracts
- **Application Layer** (`src/application/`): Use cases orchestrating business logic
  - Each use case follows pattern: constructor injection → execute method
- **Infrastructure Layer** (`src/infrastructure/`): External adapters
  - `database/`: MongoDB implementation of repository ports
  - `api/`: Express.js REST API (controllers, routes, middlewares)

## Critical Patterns

### Dependency Injection Pattern

- Controllers receive repository instances in constructor
- Use cases are instantiated in controllers with injected repositories
- Example: `ScrimController` → `CreateScrimUseCase(scrimRepository)`

### Repository Pattern Implementation

- Domain defines interfaces (`ScrimRepository`)
- Infrastructure implements adapters (`MongoScrimRepository`)
- Always use `toEntity()` and `toDocument()` converters in MongoDB adapter
- Handle `ObjectId` conversion and invalid ID errors with try-catch blocks

### Error Handling Convention

- Controllers return structured responses: `{ success: boolean, message?: string, data?: any }`
- HTTP status codes: 201 (created), 400 (validation), 404 (not found), 500 (server error)
- Use `instanceof Error` checks before accessing error properties
- Prefix unused parameters with underscore: `_req`, `_next`

### Date Handling

- Always convert string dates to `Date` objects in controllers: `new Date(scheduledDate)`
- Use `createdAt`/`updatedAt` timestamps in entities
- MongoDB stores dates as native Date objects, not strings

## Development Workflows

### Testing Strategy

- Unit tests in `__tests__/` directories alongside source files
- Mock repositories using `jest.Mocked<ScrimRepository>`
- Test pattern: arrange (mock setup) → act (execute) → assert (expect)
- Use `expect.any(Date)` for timestamp validation
- Run: `npm test` (single), `npm run test:watch` (watch), `npm run test:coverage`

### Code Quality Tools

- ESLint config in `eslint.config.mjs` with TypeScript and Prettier integration
- Unused parameter naming: prefix with underscore (enforced by linting)
- Format: `npm run format`, Lint: `npm run lint:fix`

### Development Commands

- Local development: `npm run dev` (uses nodemon + ts-node)
- Docker development: `docker-compose up` (includes MongoDB)
- Production build: `npm run build` → `npm start`
- Entry point: `src/infrastructure/api/server.ts`

## File Organization Rules

### New Features Implementation

1. **Domain First**: Define entity interfaces in `src/domain/entities/`
2. **Repository Port**: Add methods to repository interface in `src/domain/repositories/`
3. **Use Cases**: Create application logic in `src/application/use-cases/`
4. **Infrastructure**: Implement repository adapter in `src/infrastructure/database/`
5. **API Layer**: Add controller methods and routes in `src/infrastructure/api/`
6. **Tests**: Unit tests in `__tests__/` directories at each layer

### Naming Conventions

- Use cases: `{Action}{Entity}UseCase` (e.g., `CreateScrimUseCase`)
- Controllers: `{Entity}Controller` with injected use cases
- Repository implementations: `Mongo{Entity}Repository`
- Test files: `{ClassName}.test.ts`

## MongoDB Integration

### Document Mapping Pattern

- Separate MongoDB documents from domain entities
- Use `ObjectId` for `_id`, convert to string for entity `id`
- Implement `toEntity()` and `toDocument()` private methods
- Handle ObjectId parsing errors with try-catch returning `null`

### Connection Management

- Dependency injection pattern using `MongoDBAdapter` implementing `DatabaseConnection` interface
- Collections accessed via `databaseConnection.getDb().collection<DocumentType>()`
- Repository constructors inject `DatabaseConnection` via `@Inject('DatabaseConnection')`
- Use typed documents interfaces (e.g., `ScrimDocument`)

## API Design

### Routing Structure

The API follows a layered routing pattern with clear separation of concerns:

1. **Entity Routes** (`src/infrastructure/api/routes/`):
   - One route file per entity (e.g., `scrimRoutes.ts`, `playerRoutes.ts`)
   - Factory functions that accept repository instances: `create{Entity}Routes(repository)`
   - Define RESTful endpoints and bind them to controller methods
   - Export configured Express Router instances

2. **General Routes** (`src/infrastructure/api/routes/index.ts` or `app.ts`):
   - Central file that aggregates all entity routes
   - Mounts entity routes under their respective paths (e.g., `/api/scrims`, `/api/players`)
   - Registers global middlewares and health check endpoints

3. **Flow**: Request → Entity Route → Controller → Use Case → Repository

### Controller Structure

- **One controller per entity** (`{Entity}Controller`)
- **Constructor injection pattern**: Receives repository instance to initialize use cases
- **Input validation**: Controllers MUST validate all inputs before invoking use cases
  - Check required fields presence
  - Validate data types and formats
  - Convert data types as needed (e.g., strings to Date objects)
  - Return 400 Bad Request for validation failures
- **Use case instantiation**: Create use case instances with injected repositories
- **Error handling**: Structured JSON responses with consistent format
  - Success response: `{ success: true, data: any }`
  - Error response: `{ success: false, message: string }`
- **Method signature**: Async methods with `Promise<void>` return type
- **HTTP status codes**:
  - 200 (OK), 201 (created)
  - 400 (validation error), 404 (not found)
  - 500 (server error)

### Route Organization Pattern

```typescript
// Entity route file (scrimRoutes.ts)
export function createScrimRoutes(repository: ScrimRepository): Router {
  const router = Router();
  const controller = new ScrimController(repository);

  router.post('/', (req, res) => controller.create(req, res));
  router.get('/', (req, res) => controller.getAll(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));
  router.put('/:id', (req, res) => controller.update(req, res));
  router.delete('/:id', (req, res) => controller.delete(req, res));

  return router;
}

// General routes aggregation (app.ts)
app.use('/api/scrims', createScrimRoutes(scrimRepository));
app.use('/api/players', createPlayerRoutes(playerRepository));
```

When extending this codebase, maintain the hexagonal boundaries - domain logic stays in domain layer, infrastructure concerns in infrastructure layer, with application use cases as the orchestration layer.
