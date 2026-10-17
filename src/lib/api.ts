"use client";

import { toast } from "sonner";

/**
 * Small fetch-based API client that replaces the original Axios instance.
 * - Same-origin requests to the /v1 API routes (cookies are sent automatically)
 * - Shows an error toast for every failed request, like the Axios interceptor
 */
const BASE_URL = "/v1";

/** Field-level validation errors, e.g. { email: ["Invalid Email address"] } */
export type FieldErrors = Record<string, string[] | string | undefined>;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errCode?: string,
    /** Present on 400 validation errors, keyed by field name */
    public fields?: FieldErrors
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiErrorPayload = {
  message?: string;
  errCode?: string;
  /** The `Errors` map returned by the server for validation failures */
  Errors?: FieldErrors | string[] | string;
};

/**
 * Turn the server's `Errors` payload into readable text. Zod returns
 * { field: ["message", ...] }, but tolerate plain strings/arrays too.
 */
function formatFieldErrors(errors: ApiErrorPayload["Errors"]): string | undefined {
  if (!errors) return undefined;
  if (typeof errors === "string") return errors.trim() || undefined;
  if (Array.isArray(errors)) return errors.filter(Boolean).join(", ") || undefined;

  const lines = Object.entries(errors)
    .map(([field, value]) => {
      const text = Array.isArray(value) ? value.filter(Boolean).join(", ") : value;
      return text ? `${field}: ${text}` : "";
    })
    .filter(Boolean);

  return lines.length ? lines.join("\n") : undefined;
}

/** Narrow the loosely-typed `Errors` to the object form for ApiError.fields. */
function asFieldErrors(errors: ApiErrorPayload["Errors"]): FieldErrors | undefined {
  return errors && typeof errors === "object" && !Array.isArray(errors)
    ? (errors as FieldErrors)
    : undefined;
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body or raw FormData (multipart uploads) */
  body?: unknown;
  /** Query string parameters */
  params?: Record<string, string | number | undefined>;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const url = `${BASE_URL}${path}${search.toString() ? `?${search.toString()}` : ""}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "same-origin",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      headers:
        body !== undefined && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : undefined,
    });
  } catch {
    toast.error("Unable to connect to the server", { description: "NETWORK_ERROR" });
    throw new ApiError(0, "Unable to connect to the server", "NETWORK_ERROR");
  }

  if (!response.ok) {
    let message = "Unable to connect to the server";
    let errCode: string | undefined = "NETWORK_ERROR";
    let errors: ApiErrorPayload["Errors"];

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = payload.message ?? "Something went wrong";
      errCode = payload.errCode;
      errors = payload.Errors;
    } catch {
      // response had no JSON body
    }

    // Validation failures (400) carry the generic message "Validation Error"
    // plus an `Errors` map. Surface the actual field messages instead of the
    // generic text, falling back to the error code for everything else.
    const fieldText = formatFieldErrors(errors);
    toast.error(message, { description: fieldText ?? errCode });
    throw new ApiError(response.status, message, errCode, asFieldErrors(errors));
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
