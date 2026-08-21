// API envelope helpers and shared validation utilities for Next.js route handlers.

import { NextResponse } from "next/server";
import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "./types";

const ALLOWED_IDEMPOTENCY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function success<T>(data: T, requestId: string): NextResponse<ApiSuccessEnvelope<T>> {
  return NextResponse.json({ data, meta: { requestId, apiVersion: "v1" } });
}

export function failure(code: ApiErrorEnvelope["error"]["code"], message: string, status: number, requestId: string, retryable = false): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json({ error: { code, message, retryable }, meta: { requestId, apiVersion: "v1" } }, { status });
}

export function generateRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export function validateIdempotencyKey(value: unknown): { ok: true; key: string } | { ok: false; error: string } {
  if (typeof value !== "string" || !ALLOWED_IDEMPOTENCY.test(value)) {
    return { ok: false, error: "Idempotency-Key must be a UUID." };
  }
  return { ok: true, key: value };
}

export function parseJsonBody<T>(raw: unknown): { ok: true; body: T } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be an object." };
  return { ok: true, body: raw as T };
}