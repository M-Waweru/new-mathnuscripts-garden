import test from "node:test"
import assert from "node:assert/strict"
import handler from "./functions/ask.mjs"

test("ask handler returns retrieval plus NVIDIA error details for bad keys", async () => {
  const previousKey = process.env.NVIDIA_API_KEY
  process.env.NVIDIA_API_KEY = "invalid-test-key"

  try {
    const response = await handler(
      new Request("http://localhost:8888/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "What is avocado farming?" }),
      }),
    )

    assert.equal(response.status, 502)
    const body = await response.json()
    assert.equal(body.status, "error")
    assert.match(body.error, /unauthorized \(401\)|Authentication failed/u)
    assert.ok(Array.isArray(body.sources))
    assert.ok(body.sources.length > 0)
  } finally {
    if (previousKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previousKey
  }
})

test("ask handler reports missing NVIDIA_API_KEY clearly", async () => {
  const previousKey = process.env.NVIDIA_API_KEY
  delete process.env.NVIDIA_API_KEY

  try {
    const response = await handler(
      new Request("http://localhost:8888/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Hello?" }),
      }),
    )

    assert.equal(response.status, 503)
    const body = await response.json()
    assert.match(body.error, /NVIDIA_API_KEY/u)
  } finally {
    if (previousKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previousKey
  }
})
