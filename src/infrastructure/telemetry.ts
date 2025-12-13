import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { config } from "./config.js";

function createTraceExporter() {
  if (config.honeycomb.enabled && config.honeycomb.apiKey) {
    console.log("🔭 Telemetry: Using Honeycomb OTLP exporter");
    return new OTLPTraceExporter({
      url: "https://api.honeycomb.io/v1/traces",
      headers: {
        "x-honeycomb-team": config.honeycomb.apiKey,
      },
    });
  }
  console.log("🔭 Telemetry: Using Console exporter (Honeycomb disabled)");
  return new ConsoleSpanExporter();
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.honeycomb.serviceName,
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
  traceExporter: createTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy low-level network instrumentations
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-net": { enabled: false },
      "@opentelemetry/instrumentation-undici": { enabled: false },
      "@opentelemetry/instrumentation-fs": { enabled: false },
      // Keep HTTP/Express/MongoDB enabled for meaningful traces
      "@opentelemetry/instrumentation-http": { enabled: true },
      "@opentelemetry/instrumentation-express": { enabled: true },
      "@opentelemetry/instrumentation-mongodb": { enabled: true },
    }),
  ],
});

export function startTelemetry() {
  sdk.start();
}
