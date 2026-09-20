import { rankChunks } from "../../scripts/ask-index-core.mjs"
import {
  buildAskMessages,
  callNvidiaChat,
  createAskResponse,
  getNvidiaConfig,
  loadAskIndex,
  parseQuestion,
} from "../ask-core.mjs"

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

export { parseQuestion, createAskResponse } from "../ask-core.mjs"

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    })
  }

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

  const { question, context, history } = parsed
  const nvidiaConfig = getNvidiaConfig()

  let index
  try {
    index = await loadAskIndex(request)
  } catch (error) {
    return json(
      createAskResponse({
        question,
        sources: [],
        error: error instanceof Error ? error.message : "The garden index is unavailable.",
      }),
      503,
    )
  }

  const sources = rankChunks(index.chunks ?? [], question, 5).map(
    ({ score: _score, ...source }) => source,
  )

  if (!nvidiaConfig.apiKey) {
    return json(
      createAskResponse({
        question,
        sources,
        error:
          "Ask is not configured yet. Add NVIDIA_API_KEY to `.env` for local `netlify dev`, or Netlify Site settings → Environment variables for production.",
      }),
      503,
    )
  }

  try {
    const messages = buildAskMessages(question, context, sources, history)
    const answer = await callNvidiaChat(messages, nvidiaConfig)
    return json(createAskResponse({ question, sources, answer }))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ask could not reach the language model."
    return json(createAskResponse({ question, sources, error: message }), 502)
  }
}
