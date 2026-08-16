import type { Database } from "@/types/database";
import { createServerClient } from "@/lib/supabase";

export type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];

export async function listPublishedBlogPosts(limit = 10): Promise<{
  posts: BlogPostRow[];
  error: string | null;
}> {
  const client = createServerClient();
  if (!client) {
    return { posts: [], error: "supabase_not_configured" };
  }

  const { data, error } = await client
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return { posts: [], error: error.message };
  return { posts: data ?? [], error: null };
}
