/**
 * Mock Data Generator
 * Generates realistic mock data based on field names and types.
 * Uses smart field name detection to pick appropriate faker functions.
 */

import type { DataModel, ModelField, ProjectSchema } from "./types";
import { toSnakeCase } from "./types";

// Smart faker mapping based on field name patterns
const FIELD_FAKERS: Record<string, () => string> = {
  email: () => `user${Math.floor(Math.random() * 1000)}@example.com`,
  name: () => {
    const first = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
    const last = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"];
    return `${first[Math.floor(Math.random() * first.length)]!} ${last[Math.floor(Math.random() * last.length)]!}`;
  },
  first_name: () => {
    const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
    return names[Math.floor(Math.random() * names.length)]!;
  },
  last_name: () => {
    const names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"];
    return names[Math.floor(Math.random() * names.length)]!;
  },
  title: () => {
    const titles = ["Getting Started Guide", "Best Practices", "Advanced Tutorial", "Quick Tips", "Deep Dive"];
    return titles[Math.floor(Math.random() * titles.length)]!;
  },
  description: () => {
    const descs = [
      "A comprehensive guide to building modern web applications.",
      "Learn the fundamentals of React and Next.js.",
      "Explore advanced patterns for scalable architecture.",
      "Tips and tricks for better developer experience.",
      "Understanding the core concepts of TypeScript.",
    ];
    return descs[Math.floor(Math.random() * descs.length)]!;
  },
  body: () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  content: () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam.",
  phone: () => `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
  avatar: () => `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).slice(2, 8)}`,
  image: () => `https://picsum.photos/seed/${Math.random().toString(36).slice(2, 8)}/800/600`,
  url: () => `https://example.com/${Math.random().toString(36).slice(2, 8)}`,
  website: () => `https://www.${Math.random().toString(36).slice(2, 8)}.com`,
  address: () => `${Math.floor(Math.random() * 9999 + 1)} Main St, City, ST 12345`,
  company: () => {
    const cos = ["Acme Corp", "Globex Inc", "Initech", "Umbrella Co", "Stark Industries"];
    return cos[Math.floor(Math.random() * cos.length)]!;
  },
  price: () => (Math.random() * 200 + 5).toFixed(2),
  amount: () => (Math.random() * 1000 + 10).toFixed(2),
  stock: () => String(Math.floor(Math.random() * 500)),
  quantity: () => String(Math.floor(Math.random() * 100)),
  slug: () => Math.random().toString(36).slice(2, 10),
  color: () => {
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
    return colors[Math.floor(Math.random() * colors.length)]!;
  },
};

// Type-based fallback faker
const TYPE_FAKERS: Record<string, () => string> = {
  string: () => Math.random().toString(36).slice(2, 10),
  number: () => String(Math.floor(Math.random() * 1000)),
  boolean: () => String(Math.random() > 0.5),
  date: () => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ?? "",
  datetime: () => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  text: () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  email: () => `user${Math.floor(Math.random() * 1000)}@example.com`,
  url: () => `https://example.com/${Math.random().toString(36).slice(2, 8)}`,
  image: () => `https://picsum.photos/seed/${Math.random().toString(36).slice(2, 8)}/800/600`,
  phone: () => `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
  uuid: () => crypto.randomUUID(),
  json: () => "{}",
  decimal: () => (Math.random() * 1000).toFixed(2),
};

function generateFieldValue(field: ModelField): unknown {
  // Auto-increment / primary key
  if (field.isPrimaryKey || field.name === "id") return crypto.randomUUID();
  if (field.name === "created_at" || field.name === "updated_at") return new Date().toISOString();

  // Enum: random pick
  if (field.type === "enum" && field.enumValues?.length) {
    return field.enumValues[Math.floor(Math.random() * field.enumValues.length)];
  }

  // Smart field name match
  const nameLower = field.name.toLowerCase();
  for (const [pattern, faker] of Object.entries(FIELD_FAKERS)) {
    if (nameLower.includes(pattern)) return faker();
  }

  // Boolean fields
  if (nameLower.startsWith("is_") || nameLower.startsWith("has_")) {
    return String(Math.random() > 0.5);
  }

  // Type fallback
  const typeFaker = TYPE_FAKERS[field.type];
  if (typeFaker) return typeFaker();

  return "sample_value";
}

/**
 * Generate mock data for a single model.
 */
export function generateMockData(model: DataModel, count: number = 50): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];

  for (let i = 0; i < count; i++) {
    const record: Record<string, unknown> = {};
    for (const field of model.fields) {
      record[field.name] = generateFieldValue(field);
    }
    records.push(record);
  }

  return records;
}

/**
 * Generate mock data for an entire schema with relation-aware IDs.
 */
export function generateSchemaMockData(schema: ProjectSchema, count: number = 50): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {};

  // Generate models in order (independent models first)
  for (const model of schema.models) {
    const tableName = model.tableName || toSnakeCase(model.name);
    result[tableName] = generateMockData(model, count);
  }

  // Fill foreign keys with valid references
  for (const relation of schema.relations) {
    const fromTable = toSnakeCase(relation.fromModel);
    const toTable = toSnakeCase(relation.toModel);
    const fromRecords = result[fromTable];
    const toRecords = result[toTable];

    if (fromRecords && toRecords) {
      for (const record of fromRecords) {
        // Assign random valid FK
        const randomTarget = toRecords[Math.floor(Math.random() * toRecords.length)];
        if (randomTarget) record[relation.fromField] = randomTarget[relation.toField];
      }
    }
  }

  return result;
}
