import test from "node:test"
import assert from "node:assert/strict"
import {
  buildAskMessages,
  callNvidiaChat,
  createAskResponse,
  formatNvidiaError,
  getNvidiaConfig,
  parseQuestion,
} from "./ask-core.mjs"

test("parseQuestion accepts a bounded non-empty question", () => {
  assert.deepEqual(parseQuestion(JSON.stringify({ question: " What is the digital mind? " })), {
    question: "What is the digital mind?",
    context: undefined,
    history: [],
  })
})

test("parseQuestion accepts conversation history", () => {
  assert.deepEqual(
    parseQuestion(
      JSON.stringify({
        question: "Tell me more",
        history: [
          { role: "user", content: "What is this?" },
          { role: "assistant", content: "A garden note." },
          { role: "invalid", content: "ignored" },
        ],
      }),
    ),
    {
      question: "Tell me more",
      context: undefined,
      history: [
        { role: "user", content: "What is this?" },
        { role: "assistant", content: "A garden note." },
      ],
    },
  )
})

test("parseQuestion rejects missing or oversized questions", () => {
  assert.throws(() => parseQuestion(JSON.stringify({})), /question is required/u)
  assert.throws(
    () => parseQuestion(JSON.stringify({ question: "x".repeat(2001) })),
    /question is too long/u,
  )
})

test("getNvidiaConfig reads env vars with defaults", () => {
  assert.deepEqual(getNvidiaConfig({}), {
    apiKey: undefined,
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "z-ai/glm-5.3-flash",
  })
  assert.deepEqual(
    getNvidiaConfig({
      NVIDIA_API_KEY: " test-key ",
      NVIDIA_BASE_URL: "https://example.com/v1/",
      NVIDIA_MODEL: "custom/model",
    }),
    {
      apiKey: "test-key",
      baseUrl: "https://example.com/v1",
      model: "custom/model",
    },
  )
})

test("buildAskMessages includes page context and numbered sources", () => {
  const messages = buildAskMessages(
    "What is the digital mind?",
    { title: "Vision", selection: "A living garden." },
    [
      {
        id: "vision-1",
        title: "Vision",
        url: "/vision",
        heading: "Vision",
        text: "A living garden.",
      },
    ],
    [{ role: "user", content: "Earlier question" }],
  )

  assert.equal(messages[0].role, "system")
  assert.equal(messages[1].role, "user")
  assert.equal(messages[1].content, "Earlier question")
  assert.match(messages[2].content, /Current note: Vision/u)
  assert.match(messages[2].content, /Selected passage: A living garden\./u)
  assert.match(messages[2].content, /\[1\] Vision/u)
})

test("createAskResponse distinguishes complete, error, and retrieval states", () => {
  assert.deepEqual(
    createAskResponse({
      question: "What is this?",
      sources: [],
      answer: "Because the garden remembers.",
    }),
    {
      status: "complete",
      question: "What is this?",
      answer: "Because the garden remembers.",
      sources: [],
    },
  )

  assert.deepEqual(
    createAskResponse({
      question: "What is this?",
      sources: [],
      error: "NVIDIA_API_KEY is not configured",
    }),
    {
      status: "error",
      question: "What is this?",
      answer: null,
      sources: [],
      error: "NVIDIA_API_KEY is not configured",
    },
  )
})

test("formatNvidiaError maps NVIDIA problem responses to actionable messages", () => {
  assert.match(
    formatNvidiaError({ detail: "Authentication failed" }, 401),
    /unauthorized \(401\).*Authentication failed.*NVIDIA_API_KEY/u,
  )
  assert.match(formatNvidiaError({ detail: "model missing" }, 404), /model not found \(404\)/u)
  assert.match(formatNvidiaError({ detail: "end of life" }, 410), /model retired \(410\)/u)
})

test("callNvidiaChat surfaces NVIDIA 401 detail", async () => {
  await assert.rejects(
    () =>
      callNvidiaChat(
        [{ role: "user", content: "Hello" }],
        { apiKey: "bad", baseUrl: "https://example.com/v1", model: "z-ai/glm-5.3-flash" },
        async () =>
          new Response(JSON.stringify({ detail: "Authentication failed" }), { status: 401 }),
      ),
    /unauthorized \(401\).*Authentication failed/u,
  )
})

test("callNvidiaChat requires an API key", async () => {
  await assert.rejects(
    () => callNvidiaChat([], { apiKey: "", baseUrl: "https://example.com/v1", model: "x" }),
    /NVIDIA_API_KEY is not configured/u,
  )
})

test("callNvidiaChat parses a chat completion response", async () => {
  const answer = await callNvidiaChat(
    [{ role: "user", content: "Hello" }],
    { apiKey: "secret", baseUrl: "https://example.com/v1", model: "z-ai/glm-5.3-flash" },
    async (_url, init) => {
      assert.equal(init.method, "POST")
      const body = JSON.parse(String(init.body))
      assert.equal(body.temperature, 0.5)
      assert.equal(body.top_p, 1)
      assert.equal(body.max_tokens, 1024)
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "  Grounded answer.  " } }] }),
        { status: 200 },
      )
    },
  )

  assert.equal(answer, "Grounded answer.")
})
