/**
 * Token Budget Allocator
 * Distributes token budget across context sections by priority.
 * Ensures the most important context gets the most space.
 */

export interface ContextSection {
  name: string;
  priority: number;    // 1 = highest
  content: string;
  minTokens?: number;  // guaranteed minimum
  maxTokens?: number;  // hard cap
}

export interface AllocatedSection {
  name: string;
  content: string;
  truncated: boolean;
}

const CHARS_PER_TOKEN = 4; // rough estimate

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function truncateMiddle(text: string, maxTokens: number): { text: string; truncated: boolean } {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return { text, truncated: false };

  const lines = text.split("\n");
  const headLines = Math.ceil(lines.length * 0.6); // show more at top
  const tailLines = Math.floor(lines.length * 0.2);

  const head = lines.slice(0, headLines).join("\n");
  const tail = lines.slice(-tailLines).join("\n");

  return {
    text: `${head}\n\n// ... [truncated, ${lines.length - headLines - tailLines} lines omitted] ...\n\n${tail}`,
    truncated: true,
  };
}

/**
 * Allocate token budget across context sections.
 * Priority 1 gets ~50%, Priority 2 gets ~20%, etc.
 */
export function allocateTokenBudget(
  sections: ContextSection[],
  totalBudget: number = 100_000,
): AllocatedSection[] {
  // Sort by priority (lower number = higher priority)
  const sorted = [...sections].sort((a, b) => a.priority - b.priority);

  // Calculate weight per priority level
  const priorityWeights: Record<number, number> = {
    1: 0.50,  // active file + imports
    2: 0.20,  // related files
    3: 0.10,  // design tokens + metadata
    4: 0.10,  // data models
    5: 0.10,  // conversation history
  };

  // Group sections by priority
  const byPriority = new Map<number, ContextSection[]>();
  for (const section of sorted) {
    const existing = byPriority.get(section.priority) || [];
    existing.push(section);
    byPriority.set(section.priority, existing);
  }

  const results: AllocatedSection[] = [];
  let usedTokens = 0;

  for (const [priority, group] of byPriority) {
    const weight = priorityWeights[priority] || 0.05;
    const groupBudget = Math.floor(totalBudget * weight);

    // Distribute budget within group
    const totalGroupTokens = group.reduce(
      (sum, s) => sum + estimateTokens(s.content),
      0,
    );

    for (const section of group) {
      const sectionTokens = estimateTokens(section.content);
      const proportionalBudget = Math.floor(
        (sectionTokens / Math.max(totalGroupTokens, 1)) * groupBudget,
      );

      // Apply min/max constraints
      let budget = proportionalBudget;
      if (section.minTokens) budget = Math.max(budget, section.minTokens);
      if (section.maxTokens) budget = Math.min(budget, section.maxTokens);

      // Don't exceed total budget
      budget = Math.min(budget, totalBudget - usedTokens);

      if (budget <= 0) {
        results.push({ name: section.name, content: "", truncated: true });
        continue;
      }

      const { text, truncated } = truncateMiddle(section.content, budget);
      usedTokens += estimateTokens(text);

      results.push({ name: section.name, content: text, truncated });
    }
  }

  return results;
}

/**
 * Estimate total tokens for a set of context sections.
 */
export function estimateTotalTokens(sections: { content: string }[]): number {
  return sections.reduce((sum, s) => sum + estimateTokens(s.content), 0);
}
