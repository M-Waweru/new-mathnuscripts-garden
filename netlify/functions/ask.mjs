import { rankChunks } from "../../scripts/ask-index-core.mjs"
import {
  buildAskMessages,
  callNvidiaChat,
  createAskResponse,
  getNvidiaConfig,
  parseQuestion,
} from "../ask-core.mjs"

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}

export { parseQuestion, createAskResponse } from "../ask-core.mjs"

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ status: "error", error: "method_not_allowed" }, 405)
  }

  let parsed
  try {
    parsed = parseQuestion(await request.text())
  } catch (error) {
    return json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "invalid_request",
      },
      400,
    )
  }

  const { question, context } = parsed
  const nvidiaConfig = getNvidiaConfig()

  const indexUrl = new URL("/static/ask-index.json", request.url)
  const indexResponse = await fetch(indexUrl)
  if (!indexResponse.ok) {
    return json(
      createAskResponse({
        question,
        sources: [],
        error: "The garden index is unavailable. Try again shortly.",
      }),
      503,
    )
  }

  const index = await indexResponse.json()
  const sources = rankChunks(index.chunks ?? [], question, 5).map(
    ({ score: _score, ...source }) => source,
  )

  if (!nvidiaConfig.apiKey) {
    return json(
      createAskResponse({
        question,
        sources,
        error:
          "Ask is not configured yet. Add NVIDIA_API_KEY in Netlify Site settings → Environment variables.",
      }),
      503,
    )
  }

  try {
    const messages = buildAskMessages(question, context, sources)
    const answer = await callNvidiaChat(messages, nvidiaConfig)
    return json(createAskResponse({ question, sources, answer }))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ask could not reach the language model."
    return json(createAskResponse({ question, sources, error: message }), 502)
  }
}
