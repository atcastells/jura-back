import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongo: {
    uri: process.env.MONGO_URI || "",
    dbName: process.env.MONGO_DB || "jura",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  honeycomb: {
    apiKey: process.env.HONEYCOMB_API_KEY || "",
    serviceName: process.env.OTEL_SERVICE_NAME || "jura-back",
    enabled: process.env.HONEYCOMB_ENABLED === "true",
  },
};
