/**
 * Conversation Compressor
 * Compresses old conversation messages into summaries to save tokens.
 * Uses a cheap model (Gemini Flash) for summarization.
 */

import { generateText } from "ai";

import { getModel } from "@/lib/model-gateway";

export interface CompressedMessage {
  role: "user" | "assistant" | "system" | "summary";
  content: string;
  timestamp: Date;
  compressedFrom?: number; // how many messages were compressed
}

const COMPRESSION_THRESHOLD = 10; // compress every 10 messages

/**
 * Compress a batch of messages into a summary.
 */
export async function compressMessages(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const conversation = messages
    .map((m) => `[${m.role}]: ${m.content}`)
    .join("\n\n");

  const result = await generateText({
    model: getModel("gemini-2.0-flash"),
    system: `You are a conversation summarizer. Summarize the following conversation in 2-3 concise sentences. Focus on:
- Technical decisions made
- Code changes performed
- Key context for continuing the work
Do NOT include pleasantries or filler.`,
    prompt: `Conversation:\n${conversation}`,
  });

  return result.text;
}

/**
 * Compress conversation history to save tokens.
 * Returns new message array with old messages replaced by summary.
 */
export async function compressConversation(
  messages: CompressedMessage[],
): Promise<CompressedMessage[]> {
  if (messages.length < COMPRESSION_THRESHOLD) return messages;

  // Find uncompressed messages (non-summary)
  const uncompressed = messages.filter((m) => m.role !== "summary");
  if (uncompressed.length < COMPRESSION_THRESHOLD) return messages;

  // Take the oldest batch to compress
  const batch = uncompressed.slice(0, COMPRESSION_THRESHOLD);
  const lastBatchItem = batch[batch.length - 1];
  if (!lastBatchItem) return messages;
  const remaining = messages.slice(
    messages.indexOf(lastBatchItem) + 1,
  );

  // Generate summary
  const summaryText = await compressMessages(batch);

  const summary: CompressedMessage = {
    role: "summary",
    content: `Previous conversation summary (${batch.length} messages): ${summaryText}`,
    timestamp: new Date(),
    compressedFrom: batch.length,
  };

  return [summary, ...remaining];
}

/**
 * Build conversation context string for system prompt.
 * Includes summary + recent messages.
 */
export function buildConversationContext(
  messages: CompressedMessage[],
): string {
  const parts: string[] = [];

  // Add summaries first
  const summaries = messages.filter((m) => m.role === "summary");
  for (const s of summaries) {
    parts.push(`[Summary]: ${s.content}`);
  }

  // Add recent messages (last 5)
  const recent = messages
    .filter((m) => m.role !== "summary")
    .slice(-5);
  for (const m of recent) {
    parts.push(`[${m.role}]: ${m.content.slice(0, 500)}`);
  }

  return parts.join("\n\n");
}
