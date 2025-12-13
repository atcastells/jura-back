# Application Layer Guidelines

## Naming Conventions
- **Folder Structure**: Group use cases by entity (e.g., `documents/`, `users/`).
- **File Naming**: Use kebab-case and end files with `.use-case.ts` (e.g., `upload-document.use-case.ts`).
- **Class Naming**: PascalCase ending with `UseCase` (e.g., `UploadDocumentUseCase`).

## implementation
- **Dependency Injection**: Use `typedi` for dependency injection. Decorate use case classes with `@Service()`.
