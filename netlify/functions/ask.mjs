import { rankChunks } from "../../scripts/build-ask-index.mjs"

const MAX_QUESTION_LENGTH = 2000

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
  return question
}

export function createAskResponse(question, sources) {
  return {
    status: "retrieval_ready",
    question,
    answer: null,
    sources,
    message: "Sources retrieved. ChatGPT generation will be enabled in the next pilot slice.",
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405)
  }

  let question
  try {
    question = parseQuestion(await request.text())
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "invalid_request" }, 400)
  }

  const indexUrl = new URL("/static/ask-index.json", request.url)
  const indexResponse = await fetch(indexUrl)
  if (!indexResponse.ok) {
    return json({ error: "ask_index_unavailable" }, 503)
  }

  const index = await indexResponse.json()
  const sources = rankChunks(index.chunks ?? [], question, 5).map(
    ({ score: _score, ...source }) => source,
  )
  return json(createAskResponse(question, sources))
}
