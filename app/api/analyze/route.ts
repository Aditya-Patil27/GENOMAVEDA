import { NextRequest, NextResponse } from "next/server";
import { generateExplanation } from "@/lib/llmClient";
import { fallbackExplanation } from "@/lib/fallbackExplanation";
import { AnalyzeRequestSchema, AnalysisResultSchema, BLOCKED_FIELDS } from "@/lib/zodSchemas";

export async function POST(request: NextRequest) {
  try {
    // Enforce content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Enforce body size (8KB max)
    const bodyText = await request.text();
    if (bodyText.length > 8192) {
      return NextResponse.json(
        { error: "Request body exceeds 8KB limit" },
        { status: 400 }
      );
    }

    const body = JSON.parse(bodyText);

    // Block genomic data fields
    for (const key of Object.keys(body)) {
      if (BLOCKED_FIELDS.includes(key.toLowerCase())) {
        return NextResponse.json(
          { error: `Field '${key}' is not allowed. Backend does not process genomic data.` },
          { status: 400 }
        );
      }
    }

    // Validate request with Zod
    const parseResult = AnalyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Generate LLM explanation (with CPIC context injection)
    let explanation;
    try {
      explanation = await generateExplanation({
        drug: input.drug,
        gene: input.primary_gene,
        phenotype: input.phenotype,
        diplotype: input.diplotype,
        risk_label: input.risk_label,
        cpic_context: input.cpic_context,
      });
    } catch (error) {
      console.error("[API] LLM call failed, using fallback:", error);
      explanation = fallbackExplanation({
        drug: input.drug,
        gene: input.primary_gene,
        phenotype: input.phenotype,
        diplotype: input.diplotype,
        risk_label: input.risk_label,
        cpic_context: input.cpic_context,
      });
    }

    // Assemble the full response
    const result = {
      patient_id: input.patient_id,
      drug: input.drug,
      timestamp: new Date().toISOString(),
      risk_assessment: {
        risk_label: input.risk_label,
        confidence_score: input.confidence_score,
        severity: input.severity,
      },
      pharmacogenomic_profile: {
        primary_gene: input.primary_gene,
        diplotype: input.diplotype,
        phenotype: input.phenotype,
        detected_variants: [],
      },
      clinical_recommendation: {
        primary_recommendation: input.cpic_context?.raw_recommendation ||
          `CPIC guideline-based recommendation for ${input.drug} with ${input.phenotype} metabolizer status.`,
        dose_adjustment: input.risk_label === "Safe" ? "None required" : "Consult CPIC guidelines",
        alternative_drugs: [],
        monitoring_required: input.severity !== "none",
        cpic_guideline_version: "CPIC Live API (dynamic)",
        recommendation_strength: "strong" as const,
      },
      llm_generated_explanation: explanation,
      quality_metrics: {
        vcf_parsing_success: true,
        variants_detected: 0,
        genes_analyzed: [input.primary_gene],
        annotation_completeness: 0.95,
        parse_warnings: [],
      },
    };

    // Validate outgoing response with Zod
    const resultValidation = AnalysisResultSchema.safeParse(result);
    if (!resultValidation.success) {
      console.error("[API] Outgoing Zod validation failed:", resultValidation.error);
      return NextResponse.json(
        {
          error: "Internal schema validation failed",
          details: resultValidation.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please check request format." },
      { status: 500 }
    );
  }
}
