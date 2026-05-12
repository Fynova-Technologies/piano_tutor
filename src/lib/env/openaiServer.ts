/**
 * Server-only OpenAI configuration.
 * Ensures `.env.local` / `.env` are loaded for Route Handlers in dev and edge cases
 * where `process.env` is not yet populated when the module first evaluates.
 */
import { loadEnvConfig } from "@next/env";

let cachedEnvLoad = false;

function ensureEnvLoaded() {
  if (cachedEnvLoad) return;
  try {
    loadEnvConfig(process.cwd());
  } catch {
    /* Next may have already loaded env */
  }
  cachedEnvLoad = true;
}

/**
 * Reads the API key from the server environment only (never NEXT_PUBLIC_*).
 * Strips wrapping quotes and whitespace. Supports common alternate names.
 */
export function getOpenAIApiKey(): string | undefined {
  ensureEnvLoaded();
  const raw =
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_SECRET_KEY ||
    process.env.OPENAI_KEY;
  if (raw == null || typeof raw !== "string") return undefined;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getOpenAIModel(): string {
  ensureEnvLoaded();
  return (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim() || "gpt-4o-mini";
}
