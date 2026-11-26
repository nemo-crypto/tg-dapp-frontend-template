export type ServiceRequest = {
  path: string
  method: string
  data: unknown
  token: string
}

export function validateServiceRequest(value: unknown): ServiceRequest | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  if (typeof input.path !== "string" || !input.path.trim() || typeof input.method !== "string") return null
  const method = input.method.toUpperCase()
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)) return null
  if (input.token !== undefined && typeof input.token !== "string") return null
  return {path: input.path, method, data: input.data ?? null, token: input.token as string ?? ""}
}
