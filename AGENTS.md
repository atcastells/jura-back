# AGENTS.md

Instructions for AI coding assistants working with this repository.

## Project Overview

A Node.js backend application using **hexagonal architecture** (ports & adapters pattern). Built with TypeScript, Express.js, and Drizzle ORM.

## Package Manager

**Use `pnpm`** for all package operations.

```bash
pnpm install          # Install dependencies
pnpm add <package>    # Add a dependency
pnpm add -D <package> # Add a dev dependency
```

## Build & Run Commands

```bash
pnpm dev              # Start development server with hot reload
pnpm build            # Compile TypeScript to JavaScript
pnpm start            # Run production build
```

## Testing

```bash
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
```

## Code Quality

```bash
pnpm lint             # Check for linting errors
pnpm lint:fix         # Fix linting errors automatically
pnpm format           # Format code with Prettier
```

## Project Structure

```
src/
├── adapters/         # Interface adapters (controllers, repositories)
├── domain/           # Business logic and entities
└── infrastructure/   # Frameworks, drivers, external services
```

## Code Style Guidelines

- Follow **hexagonal architecture** principles
- Keep domain logic isolated from infrastructure concerns
- Use TypeScript strict mode
- Run `pnpm lint` and `pnpm format` before committing

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure required environment variables
3. Run `pnpm install`

## Docker

```bash
docker-compose up     # Start services with Docker
```
