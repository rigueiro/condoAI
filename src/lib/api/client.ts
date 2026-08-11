/**
 * Thin JSON fetch helper for the CondoAI API.
 * Throws Error with `message` set to the server error code when non-OK.
 */

export class ApiError extends Error {
  status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "requestFailed",
      res.status,
    );
  }

  return data as T;
}
