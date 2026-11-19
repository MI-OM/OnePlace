import { NextResponse } from "next/server";
import { VoiceAuthError } from "@/lib/voice";
import { logger } from "@/lib/logger";

/** Reads a JSON body and returns its `sessionId`, or null if missing/invalid. */
export async function readSessionId(request: Request): Promise<string | null> {
  try {
    const body = (await request.json()) as { sessionId?: unknown };
    return typeof body?.sessionId === "string" && body.sessionId
      ? body.sessionId
      : null;
  } catch {
    return null;
  }
}

/** Maps voice errors to a safe HTTP response without leaking internals. */
export function voiceErrorResponse(e: unknown, route: string) {
  if (e instanceof VoiceAuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  logger.error(`voice ${route} failed`, { error: String(e) });
  return NextResponse.json(
    { error: "Something went wrong with the call." },
    { status: 500 },
  );
}
