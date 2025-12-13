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

## Task Management (Linear)

This project uses Linear for task tracking. Agents MUST:

1.  **Always work towards an existing Linear task.**
2.  **Verify the task status** before starting work.
3.  **Update task status** as work progresses (e.g., move to "In Progress", add comments).
4.  **Mark tasks as Done** only after verification and user approval.

## Task Processing Best Practices

When working on a task, follow these steps to ensure quality and context retention:

1.  **Context Loading**:
    - Read the Linear task description carefully.
    - Check for linked PRs, documents, or parent issues.
    - Read relevant code files to build a mental model of the affected area.

2.  **Execution**:
    - Break down complex tasks into smaller, verifiable steps.
    - Use the `search_web` or documentation tools if you encounter unknown libraries or patterns.
    - Write tests _before_ or _during_ implementation (TDD/BDD) whenever possible.

3.  **Context Storage & Handoff**:
    - If a task cannot be completed in critical detail, leave a detailed comment on the Linear issue summarizing:
      - What has been done.
      - What is blocked or pending.
      - Relevant file paths and code snippets.
    - Update the `AGENTS.md` or a specific `TODO.md` if architectural decisions change significantly.

4.  **Verification**:
    - Run `pnpm test` to ensure no regressions.
    - Run `pnpm lint` to maintain code standards.
    - Verify the feature works as expected in the local environment.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure required environment variables
3. Run `pnpm install`

## Docker

```bash
docker-compose up     # Start services with Docker
```
