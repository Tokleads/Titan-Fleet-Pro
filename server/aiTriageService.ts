import { openai } from "./replit_integrations/image/client";
import { db } from "./db";
import { defects } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AITriageResult {
  severity: string;
  category: string;
  confidence: number;
  analysis: string;
}

const CATEGORIES = [
  "LIGHTS", "BRAKES", "TYRES", "ENGINE", "BODYWORK", "WINDSCREEN",
  "MIRRORS", "EXHAUST", "STEERING", "SUSPENSION", "ELECTRICAL", "FLUIDS", "OTHER"
] as const;

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const SYSTEM_PROMPT = `You are a UK fleet compliance expert specialising in commercial vehicle defect analysis. You analyse vehicle defect photos and descriptions to categorise severity and type for DVSA compliance.

You MUST respond with valid JSON only, no markdown, no extra text. Use this exact format:
{
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "category": one of: ${CATEGORIES.join(", ")},
  "confidence": number between 0 and 100,
  "analysis": "Brief explanation of the defect and reasoning for severity/category classification"
}

Severity guidelines:
- LOW: Cosmetic or minor issue, vehicle safe to operate, repair at next service
- MEDIUM: Issue needs attention within 7 days, monitor closely
- HIGH: Defect requires urgent repair within 24-48 hours, may affect roadworthiness
- CRITICAL: Immediate prohibition risk, vehicle must not be operated until repaired (e.g. brake failure, steering defect, tyre below legal limit)`;

const TEXT_ONLY_SYSTEM_PROMPT = `You are a UK fleet compliance expert specialising in commercial vehicle defect categorisation. Based on a text description of a vehicle defect, categorise its severity and type for DVSA compliance.

You MUST respond with valid JSON only, no markdown, no extra text. Use this exact format:
{
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "category": one of: ${CATEGORIES.join(", ")},
  "confidence": number between 0 and 100,
  "analysis": "Brief explanation of the defect and reasoning for severity/category classification"
}

Severity guidelines:
- LOW: Cosmetic or minor issue, vehicle safe to operate, repair at next service
- MEDIUM: Issue needs attention within 7 days, monitor closely
- HIGH: Defect requires urgent repair within 24-48 hours, may affect roadworthiness
- CRITICAL: Immediate prohibition risk, vehicle must not be operated until repaired (e.g. brake failure, steering defect, tyre below legal limit)

Note: Without a photo, confidence should generally be lower (typically 40-70) as visual confirmation is not available.`;

function parseAIResponse(content: string): AITriageResult {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned);

  const severity = SEVERITIES.includes(parsed.severity) ? parsed.severity : "MEDIUM";
  const category = CATEGORIES.includes(parsed.category) ? parsed.category : "OTHER";
  const confidence = typeof parsed.confidence === "number"
    ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
    : 50;
  const analysis = typeof parsed.analysis === "string" ? parsed.analysis : "Unable to provide detailed analysis.";

  return { severity, category, confidence, analysis };
}

export async function analyzeDefectPhoto(imageUrl: string, description: string): Promise<AITriageResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl }
            },
            {
              type: "text",
              text: `Analyse this vehicle defect photo. The driver described the defect as: "${description}". Provide your assessment as JSON.`
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from AI model");
    }

    return parseAIResponse(content);
  } catch (error) {
    console.error("AI defect photo analysis failed:", error);
    return {
      severity: "MEDIUM",
      category: "OTHER",
      confidence: 0,
      analysis: "AI analysis unavailable - manual review required."
    };
  }
}

export async function triageDefectTextOnly(description: string): Promise<AITriageResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: TEXT_ONLY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Categorise this vehicle defect based on the following description: "${description}". Provide your assessment as JSON.`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from AI model");
    }

    return parseAIResponse(content);
  } catch (error) {
    console.error("AI defect text-only analysis failed:", error);
    return {
      severity: "MEDIUM",
      category: "OTHER",
      confidence: 0,
      analysis: "AI analysis unavailable - manual review required."
    };
  }
}

function getPublicPhotoUrl(photoPath: string, baseUrl?: string): string | null {
  if (!photoPath) return null;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) return photoPath;
  if (photoPath.startsWith('data:')) return photoPath;

  if (baseUrl) {
    return `${baseUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  }

  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) {
    return `https://${domain}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  }
  return null;
}

export async function triageDefect(defectId: number, baseUrl?: string): Promise<void> {
  try {
    const [defect] = await db.select().from(defects).where(eq(defects.id, defectId)).limit(1);

    if (!defect) {
      console.error(`Defect with ID ${defectId} not found`);
      return;
    }

    let result: AITriageResult;

    const fullPhotoUrl = defect.photo ? getPublicPhotoUrl(defect.photo, baseUrl) : null;
    if (fullPhotoUrl) {
      console.log(`[AI Triage] Analyzing defect ${defectId} with photo: ${fullPhotoUrl}`);
      result = await analyzeDefectPhoto(fullPhotoUrl, defect.description);
    } else {
      console.log(`[AI Triage] Analyzing defect ${defectId} text-only: "${defect.description}"`);
      result = await triageDefectTextOnly(defect.description);
    }

    await db.update(defects).set({
      aiSeverity: result.severity,
      aiCategory: result.category,
      aiConfidence: result.confidence,
      aiAnalysis: result.analysis,
      aiTriaged: true,
      aiTriagedAt: new Date()
    }).where(eq(defects.id, defectId));
  } catch (error) {
    console.error(`Failed to triage defect ${defectId}:`, error);
  }
}
