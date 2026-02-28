import { Express, Request, Response } from "express";
import { z } from "zod";
import { searchComplianceKnowledge } from "./complianceSearchService";
import { openai } from "./replit_integrations/image/client";
import { requirePermission } from "./permissionGuard";

const complianceQuerySchema = z.object({
  query: z.string().min(1, "Query is required").max(2000),
});

export function registerComplianceCopilotRoutes(app: Express) {
  app.post(
    "/api/compliance/query",
    requirePermission("compliance-copilot"),
    async (req: Request, res: Response) => {
      const validation = complianceQuerySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid input", issues: validation.error.issues });
      }

      const { query } = validation.data;

      try {
        const sources = await searchComplianceKnowledge({ query, topK: 3 });

        const relevantSources = sources.filter((s) => s.similarity > 0.25);

        const contextBlock =
          relevantSources.length > 0
            ? relevantSources
                .map(
                  (s) =>
                    `[${s.complianceReference || s.sectionTitle}]\n${s.content}`
                )
                .join("\n\n---\n\n")
            : "No specific DVSA guidance found for this query.";

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are the Titan Compliance Copilot, an expert AI assistant specialising in UK commercial vehicle compliance, DVSA regulations, and fleet operator duties. You provide legally grounded advice based on the DVSA Guide to Maintaining Roadworthiness.

IMPORTANT RULES:
- Always reference specific DVSA sections when available
- Be precise about legal obligations vs best practice recommendations
- If the retrieved context doesn't fully answer the question, say so clearly
- Use clear, professional language suitable for transport managers
- Structure your responses with headings and bullet points where appropriate
- Always note when something requires professional legal advice

The following DVSA reference material has been retrieved based on the user's query:

${contextBlock}`,
            },
            {
              role: "user",
              content: query,
            },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        });

        const aiResponse = response.choices[0]?.message?.content || "Unable to generate a response.";

        const sourcesMetadata = relevantSources.map((s) => ({
          sectionTitle: s.sectionTitle,
          complianceReference: s.complianceReference,
          similarity: Math.round(s.similarity * 100),
          category: s.category,
        }));

        return res.json({
          response: aiResponse,
          sources: sourcesMetadata,
          query,
          model: "gpt-4o",
          retrievedChunks: relevantSources.length,
        });
      } catch (error: any) {
        console.error("[ComplianceCopilot] Query failed:", error);
        return res.status(500).json({
          error: "Failed to process compliance query",
          message: error.message || "Internal server error",
        });
      }
    }
  );
}
