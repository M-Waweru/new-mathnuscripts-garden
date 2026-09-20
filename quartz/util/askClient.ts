export function formatAskClientError(error: unknown): string {
  if (!(error instanceof Error)) return "Ask is unavailable right now."

  const message = error.message.trim()
  if (!message) return "Ask is unavailable right now."

  if (/unsuccessful|load failed|failed to fetch|networkerror|network error|aborted|timed out/i.test(message)) {
    return [
      "Could not reach the Ask API (network error).",
      'Local: run "npm run dev" (Netlify dev) — quartz preview alone does not serve /api/ask.',
      "Production: deploy on Netlify with functions enabled and set NVIDIA_API_KEY in Site env vars.",
    ].join(" ")
  }

  return message
}

export function extractApiError(data: Record<string, unknown>, response: Response): string {
  if (typeof data.error === "string" && data.error) return data.error
  if (typeof data.message === "string" && data.message) return data.message
  if (typeof data.detail === "string" && data.detail) {
    return `${data.detail} (HTTP ${response.status})`
  }
  return `Ask request failed (HTTP ${response.status}).`
}
