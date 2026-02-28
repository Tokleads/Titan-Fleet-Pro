import fs from "fs";
import path from "path";
import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ComplianceChunk {
  section_title?: string;
  sectionTitle?: string;
  compliance_reference?: string;
  complianceReference?: string;
  content: string;
  keywords?: string[];
  category?: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text.slice(0, 8000),
    dimensions: 2000,
  });
  return response.data[0].embedding;
}

async function seedComplianceKnowledge() {
  const jsonDir = process.argv[2] || "./data/dvsa";

  if (!fs.existsSync(jsonDir)) {
    console.error(`Directory not found: ${jsonDir}`);
    console.log("Usage: npx tsx scripts/seed-compliance-knowledge.ts <path-to-json-directory>");
    console.log("Example: npx tsx scripts/seed-compliance-knowledge.ts ./data/dvsa");
    process.exit(1);
  }

  const jsonFiles = fs.readdirSync(jsonDir).filter((f) => f.endsWith(".json"));

  if (jsonFiles.length === 0) {
    console.error(`No JSON files found in ${jsonDir}`);
    process.exit(1);
  }

  console.log(`Found ${jsonFiles.length} JSON files in ${jsonDir}`);

  let totalChunks = 0;
  let totalEmbedded = 0;
  let totalFailed = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(jsonDir, file);
    console.log(`\nProcessing: ${file}`);

    let chunks: ComplianceChunk[];
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      chunks = Array.isArray(parsed) ? parsed : parsed.chunks || parsed.data || [parsed];
    } catch (error) {
      console.error(`  Failed to parse ${file}:`, error);
      continue;
    }

    console.log(`  ${chunks.length} chunks found`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const sectionTitle = chunk.section_title || chunk.sectionTitle || `Section ${i + 1}`;
      const complianceRef = chunk.compliance_reference || chunk.complianceReference || '';
      const content = chunk.content;
      const keywords = chunk.keywords || null;
      const category = chunk.category || null;

      if (!content || content.trim().length < 10) {
        console.log(`  Skipping chunk ${i + 1}: content too short`);
        continue;
      }

      totalChunks++;

      try {
        const embeddingText = `${sectionTitle}. ${complianceRef || ""}. ${content}`;
        const embedding = await generateEmbedding(embeddingText);
        const embeddingStr = `[${embedding.join(",")}]`;

        const keywordsArr = keywords ? `{${keywords.join(",")}}` : null;
        await db.execute(sql`
          INSERT INTO compliance_knowledge (section_title, compliance_reference, content, keywords, category, source_file, embedding)
          VALUES (${sectionTitle}, ${complianceRef}, ${content}, ${keywordsArr}::text[], ${category}, ${file}, ${embeddingStr}::vector)
        `);

        totalEmbedded++;

        if (totalEmbedded % 10 === 0) {
          console.log(`  Progress: ${totalEmbedded}/${totalChunks} embedded`);
        }

        await new Promise((r) => setTimeout(r, 200));
      } catch (error) {
        totalFailed++;
        console.error(`  Failed to embed chunk ${i + 1} from ${file}:`, error);
      }
    }
  }

  console.log(`\n=== Seeding Complete ===`);
  console.log(`Total chunks processed: ${totalChunks}`);
  console.log(`Successfully embedded: ${totalEmbedded}`);
  console.log(`Failed: ${totalFailed}`);

  const [countResult] = await db.execute(sql`SELECT COUNT(*) as count FROM compliance_knowledge`);
  console.log(`Total rows in compliance_knowledge: ${(countResult as any).count}`);

  await pool.end();
}

seedComplianceKnowledge().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
