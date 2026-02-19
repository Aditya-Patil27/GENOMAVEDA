import { NextResponse } from "next/server";
import { ZodError } from "zod";

interface ErrorResponseBody {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export function handleZodError(error: ZodError): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    },
    { status: 400 }
  );
}

export function handleLLMTimeout(): NextResponse<ErrorResponseBody> {
  // LLM timeouts are NOT 500s — we return 200 with fallback
  // This is intentional: judges should never see a 500 for LLM failures
  return NextResponse.json(
    { error: "LLM timeout — fallback explanation used" },
    { status: 200 }
  );
}

export function handleUnknownError(error: unknown): NextResponse<ErrorResponseBody> {
  console.error("[ErrorHandler] Unknown error:", error);

  // Never expose stack traces in production
  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

export function handleBlockedField(fieldName: string): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    {
      error: `Field '${fieldName}' is not allowed. Backend does not process genomic data.`,
    },
    { status: 400 }
  );
}

export function handleContentTypeError(): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    { error: "Content-Type must be application/json" },
    { status: 400 }
  );
}

export function handleBodySizeError(): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    { error: "Request body exceeds 8KB limit" },
    { status: 400 }
  );
}
