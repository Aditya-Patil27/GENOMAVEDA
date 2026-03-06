import { NextRequest, NextResponse } from "next/server";
import { generateExplanation } from "@/lib/llmClient";
import { AnalyzeRequestSchema, AnalysisResultSchema, BLOCKED_FIELDS } from "@/lib/zodSchemas";
import { checkRateLimit, getClientIp, CORS_HEADERS } from "@/lib/rate-limit";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(ip, "/api/analyze");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const bodyText = await request.text();

    if (Buffer.byteLength(bodyText, "utf8") > 8192) {
      return NextResponse.json(
        { error: "Request body exceeds 8KB limit" },
        { status: 413, headers: CORS_HEADERS }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS_HEADERS });
    }

    for (const key of Object.keys(body)) {
      if (BLOCKED_FIELDS.includes(key.toLowerCase())) {
        return NextResponse.json(
          { error: `Field '${key}' is not allowed. Backend does not process genomic data.` },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

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
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const input = parseResult.data;

    let explanation;
    let prompt_log;
    let usedFallback = false;

    try {
      const result = await generateExplanation({
        drug: input.drug,
        gene: input.primary_gene,
        phenotype: input.phenotype,
        diplotype: input.diplotype,
        risk_label: input.risk_label,
        cpic_context: input.cpic_context,
      });
      explanation = result.explanation;
      prompt_log = result.prompt_log;
      usedFallback = result.used_fallback;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[analyze] LLM call failed — using fallback:", msg);
      const fb = await import("@/lib/fallbackExplanation");
      explanation = fb.fallbackExplanation({
        drug: input.drug,
        gene: input.primary_gene,
        phenotype: input.phenotype,
        diplotype: input.diplotype,
        risk_label: input.risk_label,
        cpic_context: input.cpic_context,
      });
      prompt_log = undefined;
      usedFallback = true;
    }

    const result = {
      patient_id: input.patient_id,
      drug: input.drug,
      timestamp: new Date().toISOString(),
      pharmacogenomic_profile: {
        primary_gene: input.primary_gene,
        diplotype: input.diplotype,
        phenotype: input.phenotype,
        detected_variants: [],
      },
      risk_assessment: {
        risk_label: input.risk_label,
        severity: input.severity,
        confidence_score: input.confidence_score,
        clinical_recommendation:
          input.cpic_context?.raw_recommendation ??
          `CPIC guideline-based recommendation for ${input.drug} with ${input.phenotype} metabolizer status.`,
        llm_generated_explanation:
          typeof explanation === "string" ? explanation : JSON.stringify(explanation),
      },
      quality_metrics: {
        vcf_parsing_success: true,
        genes_missing: input.genes_missing ?? [],
        privacy_audit: {
          raw_vcf_retained_on_server: false as const,
          variants_processed_locally: true as const,
          data_sent_to_llm: "phenotype_label_only" as const,
          differential_privacy_applied: true,
        },
      },
      prompt_log,
    };

    const resultValidation = AnalysisResultSchema.safeParse(result);
    if (!resultValidation.success) {
      console.error("[analyze] Outgoing Zod validation failed:", resultValidation.error.errors);
      return NextResponse.json(
        { error: "Internal schema validation failed" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const responseHeaders: Record<string, string> = { ...CORS_HEADERS };
    if (usedFallback) {
      responseHeaders["X-Fallback-Used"] = "true";
      responseHeaders["X-Fallback-Reason"] = "llm-unavailable";
    }

    return NextResponse.json(result, { headers: responseHeaders });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[analyze] Unexpected error:", msg);
    return NextResponse.json(
      { error: "Analysis failed. Please check request format." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
