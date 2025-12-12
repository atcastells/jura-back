## Scrim Planner Backend

Backend service for coordinating scrimmage sessions, implemented with a clean hexagonal (ports and adapters) architecture. The goal of this project is to keep business rules isolated from frameworks and external services so the core logic stays portable and easy to test.

### Features
- Express-based HTTP API with layered routing and controller validation
- Hexagonal architecture separating domain, application, and infrastructure concerns
- MongoDB persistence with repository adapters and document ↔ entity mappers
- Jest unit test suite with mockable repositories and use case coverage
- ESLint + Prettier configuration for consistent TypeScript styling

### Project Structure
```
src/
├─ adapters/
│  ├─ inbound/        # Express app, controllers, middlewares, routes
│  └─ outbound/       # External adapters (persistence, auth, tools)
├─ domain/            # Entities, repositories (ports), services, use cases
└─ infrastructure/    # Server bootstrap and runtime wiring
```

### Prerequisites
- Node.js 20+
- npm 9+
- Docker (optional, for running MongoDB locally via docker-compose)

### Setup
1. Install dependencies:
	 ```powershell
	 npm install
	 ```
2. Copy environment template and adjust values:
	 ```powershell
	 Copy-Item .env.example .env
	 ```
3. Start supporting services (optional):
	 ```powershell
	 docker-compose up --detach
	 ```

### Development
- Start the API in watch mode:
	```powershell
	npm run dev
	```
- Run linter and formatter:
	```powershell
	npm run lint:fix
	npm run format
	```

### Testing
- Execute the full test suite:
	```powershell
	npm test
	```
- Watch mode for rapid feedback:
	```powershell
	npm run test:watch
	```
- Coverage report:
	```powershell
	npm run test:coverage
	```

### Building & Running
- Create a production build:
	```powershell
	npm run build
	```
- Launch the compiled server:
	```powershell
	npm start
	```

### Docker Workflow
If you prefer containers, the included `Dockerfile` and `docker-compose.yml` spin up the API alongside MongoDB:
```powershell
docker-compose up --build
```
Use `docker-compose down` to stop and remove the containers when finished.

### Contributing
1. Create a feature branch.
2. Add unit tests for new business logic.
3. Run linting and tests before opening a pull request.

### License
This project is licensed under the MIT License. See `LICENSE` for details.
