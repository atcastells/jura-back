# HTTP Routes AGENTS.md

This directory contains HTTP route handlers and Express middleware for the Jura API.

## Critical: Keep OpenAPI Spec Updated

**When adding or modifying routes in this directory, you MUST update the OpenAPI specification at:**

```
src/infrastructure/openapi.yaml
```

## Route Creation Checklist

When adding a new route:

1. **Create the route** in `app.ts` or a dedicated router file
2. **Update `openapi.yaml`** with the endpoint documentation
3. **Test** via `http://localhost:3000/docs`

## OpenAPI Entry Template

For each new endpoint, add to `openapi.yaml`:

```yaml
/your-endpoint:
  post:
    tags:
      - YourTag
    summary: Brief description
    operationId: uniqueOperationName
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              field:
                type: string
    responses:
      "200":
        description: Success
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: string
      "400":
        description: Bad request
      "401":
        description: Unauthorized
```

## Directory Structure

- `app.ts` - Express app setup and route registration
- `middlewares/` - Authentication, error handling, validation
