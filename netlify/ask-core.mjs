import { readFile } from "node:fs/promises"
import { join } from "node:path"

const MAX_QUESTION_LENGTH = 2000
const MAX_HISTORY_TURNS = 12
const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
const DEFAULT_NVIDIA_MODEL = "z-ai/glm-5.3-flash"

export function parseQuestion(body) {
  let payload
  try {
    payload = JSON.parse(body)
  } catch {
    throw new Error("request body must be valid JSON")
  }
  const question = typeof payload?.question === "string" ? payload.question.trim() : ""
  if (!question) throw new Error("question is required")
  if (question.length > MAX_QUESTION_LENGTH) throw new Error("question is too long")
  const context =
    payload?.context && typeof payload.context === "object" ? payload.context : undefined
  const history = normalizeHistory(payload?.history)
  return { question, context, history }
}

export function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (entry) =>
        entry &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string",
    )
    .map((entry) => ({ role: entry.role, content: entry.content.trim() }))
    .filter((entry) => entry.content.length > 0)
    .slice(-MAX_HISTORY_TURNS)
}

export function getNvidiaConfig(env = process.env) {
  const apiKey = env.NVIDIA_API_KEY?.trim()
  const baseUrl = (env.NVIDIA_BASE_URL || DEFAULT_NVIDIA_BASE_URL).replace(/\/+$/, "")
  const model = env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL
  return { apiKey, baseUrl, model }
}

export async function loadAskIndex(request, fetchImpl = fetch) {
  const candidates = [
    join(process.cwd(), "public/static/ask-index.json"),
    join(process.cwd(), "quartz/static/ask-index.json"),
  ]

  for (const filePath of candidates) {
    try {
      const raw = await readFile(filePath, "utf8")
      return JSON.parse(raw)
    } catch {
      // try the next candidate
    }
  }

  const indexUrl = new URL("/static/ask-index.json", request.url)
  const indexResponse = await fetchImpl(indexUrl)
  if (!indexResponse.ok) {
    throw new Error("The garden index is unavailable. Try again shortly.")
  }
  return indexResponse.json()
}

export function buildAskMessages(question, context, sources, history = []) {
  const contextLines = []
  if (context?.title) contextLines.push(`Current note: ${context.title}`)
  if (context?.selection) contextLines.push(`Selected passage: ${context.selection}`)

  const sourceLines =
    sources.length === 0
      ? "No garden sources matched this question."
      : sources
          .map(
            (source, index) =>
              `[${index + 1}] ${source.title} — ${source.heading}\n${source.text}\nLink: ${source.url}`,
          )
          .join("\n\n")

  const system = [
    "You are Ask Mathnuscripts, an assistant for Mathenge Waweru's digital garden.",
    "Answer clearly and conversationally using only the supplied garden sources.",
    "Cite supporting claims with [1], [2], etc.",
    "If the sources do not contain enough information, say so honestly.",
    "You may answer follow-up questions using prior conversation context and fresh sources.",
  ].join(" ")

  const user = [
    contextLines.join("\n"),
    `Question: ${question}`,
    "Garden sources:",
    sourceLines,
  ]
    .filter(Boolean)
    .join("\n\n")

  return [{ role: "system", content: system }, ...history, { role: "user", content: user }]
}

export function createAskResponse({ question, sources, answer = null, error = null }) {
  if (error) {
    return {
      status: "error",
      question,
      answer: null,
      sources,
      error,
    }
  }

  if (answer) {
    return {
      status: "complete",
      question,
      answer,
      sources,
    }
  }

  return {
    status: "retrieval_ready",
    question,
    answer: null,
    sources,
    message: "Sources retrieved. Configure NVIDIA_API_KEY to enable answers.",
  }
}

export async function callNvidiaChat(messages, config, fetchImpl = fetch) {
  if (!config.apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured")
  }

  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.5,
      top_p: 1,
      max_tokens: 1024,
      stream: false,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail =
      payload?.error?.message ||
      payload?.message ||
      `NVIDIA request failed with status ${response.status}`
    throw new Error(detail)
  }

  const answer = payload?.choices?.[0]?.message?.content?.trim()
  if (!answer) throw new Error("NVIDIA returned an empty answer")
  return answer
}
