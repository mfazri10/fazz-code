/**
 * Data Model Types
 * Core types for the Data Model Builder feature.
 */

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "text"
  | "email"
  | "url"
  | "image"
  | "phone"
  | "uuid"
  | "json"
  | "enum"
  | "decimal";

export interface ModelField {
  name: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  enumValues?: string[];     // for type=enum
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: { model: string; field: string }; // FK reference
}

export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

export interface ModelRelation {
  id: string;
  type: RelationType;
  fromModel: string;
  toModel: string;
  fromField: string;  // FK field name
  toField: string;    // referenced field name
  cascadeDelete?: boolean;
  label?: string;     // readable description
}

export interface DataModel {
  id: string;
  name: string;          // PascalCase: User, Product
  tableName: string;     // snake_case: users, products
  fields: ModelField[];
  description?: string;
}

export interface MockConfig {
  count: number;          // number of records to generate
  seed?: number;          // for reproducibility
}

export interface ProjectSchema {
  models: DataModel[];
  relations: ModelRelation[];
}

/**
 * Default field for every model.
 */
export function getDefaultFields(): ModelField[] {
  return [
    { name: "id", type: "uuid", required: true, unique: true, isPrimaryKey: true },
    { name: "created_at", type: "datetime", required: true, unique: false, defaultValue: "now()" },
    { name: "updated_at", type: "datetime", required: true, unique: false, defaultValue: "now()" },
  ];
}

/**
 * Convert PascalCase to snake_case.
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

/**
 * Convert snake_case to PascalCase.
 */
export function toPascalCase(str: string): string {
  return str
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}
