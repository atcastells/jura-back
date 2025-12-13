# Application Layer Guidelines

## Use Case Rules

- **One Use Case per File**: Each use case class MUST be in its own dedicated file. Do not combine multiple use cases in a single file.

## Naming Conventions

- **Folder Structure**: Group use cases by entity (e.g., `documents/`, `users/`).
- **File Naming**: Use kebab-case and end files with `.use-case.ts` (e.g., `upload-document.use-case.ts`).
- **Class Naming**: PascalCase ending with `UseCase` (e.g., `UploadDocumentUseCase`).

## Implementation

- **Dependency Injection**: Use `typedi` for dependency injection. Decorate use case classes with `@Service()`.
