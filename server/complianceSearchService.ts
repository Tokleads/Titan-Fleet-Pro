import { db } from "./db";
import { complianceKnowledge } from "@shared/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const searchQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  topK: z.number().int().min(1).max(10).optional().default(3),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export interface ComplianceSearchResult {
  id: number;
  sectionTitle: string;
  complianceReference: string | null;
  content: string;
  category: string | null;
  similarity: number;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

export async function searchComplianceKnowledge(
  input: SearchQuery
): Promise<ComplianceSearchResult[]> {
  const validated = searchQuerySchema.parse(input);

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(validated.query);
  } catch (embeddingError) {
    console.error("[ComplianceSearch] Failed to generate query embedding:", embeddingError);
    return [];
  }

  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  try {
    const results = await db.execute(sql`
      SELECT
        id,
        section_title,
        compliance_reference,
        content,
        category,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM compliance_knowledge
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${validated.topK}
    `);

    return (results.rows as any[]).map((row) => ({
      id: row.id,
      sectionTitle: row.section_title,
      complianceReference: row.compliance_reference,
      content: row.content,
      category: row.category,
      similarity: parseFloat(row.similarity),
    }));
  } catch (dbError) {
    console.error("[ComplianceSearch] Vector search query failed:", dbError);
    return [];
  }
}

export async function getComplianceContext(defectDescription: string): Promise<string> {
  try {
    const results = await searchComplianceKnowledge({
      query: defectDescription,
      topK: 3,
    });

    if (results.length === 0) {
      return "";
    }

    const context = results
      .filter((r) => r.similarity > 0.3)
      .map(
        (r) =>
          `[${r.complianceReference || r.sectionTitle}] (Relevance: ${Math.round(r.similarity * 100)}%)\n${r.content}`
      )
      .join("\n\n---\n\n");

    return context;
  } catch (error) {
    console.error("[ComplianceSearch] Failed to retrieve context:", error);
    return "";
  }
}

export { generateEmbedding };
