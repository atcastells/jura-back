import { NextFunction, Request, Response } from "express";
import { trace } from "@opentelemetry/api";

export const otelLoggingMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const span = trace.getActiveSpan();

  if (span) {
    // Capture request body (if present and safe to log)
    if (request.body) {
      try {
        span.setAttribute(
          "app.interaction.request",
          JSON.stringify(request.body),
        );
      } catch {
        // Ignore error
        span.setAttribute(
          "app.interaction.request.error",
          "Failed to serialize request body",
        );
      }
    }

    // Capture response body by intercepting response.send and response.json
    const originalSend = response.send;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.send = function (body: any) {
      try {
        // Attempt to parse if it's a string, or stringify if object
        const content = typeof body === "string" ? body : JSON.stringify(body);
        span.setAttribute("app.interaction.response", content);
      } catch {
        // Ignore error
        span.setAttribute(
          "app.interaction.response.error",
          "Failed to serialize response body",
        );
      }
      return originalSend.call(this, body);
    };
  }

  next();
};
