"use client";

import { toast } from "sonner";

/**
 * Small fetch-based API client that replaces the original Axios instance.
 * - Same-origin requests to the /v1 API routes (cookies are sent automatically)
 * - Shows an error toast for every failed request, like the Axios interceptor
 */
const BASE_URL = "/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errCode?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
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
    try {
      const data = (await response.json()) as { message?: string; errCode?: string };
      message = data.message ?? "Something went wrong";
      errCode = data.errCode;
    } catch {
      // response had no JSON body
    }
    toast.error(message, { description: errCode });
    throw new ApiError(response.status, message, errCode);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
