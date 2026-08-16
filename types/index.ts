import type { Database } from "./database";

export type { Database, Json } from "./database";

export type TaxAccountantRow =
  Database["public"]["Tables"]["tax_accountants"]["Row"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];
