import test from "node:test"
import assert from "node:assert/strict"
import { extractApiError, formatAskClientError } from "./askClient"

test("formatAskClientError maps WebKit network failures to setup guidance", () => {
  const message = formatAskClientError(new Error("The request was unsuccessful."))
  assert.match(message, /Could not reach the Ask API/u)
  assert.match(message, /npm run dev/u)
})

test("extractApiError prefers server error strings and HTTP status", () => {
  assert.equal(
    extractApiError(
      { error: "NVIDIA API unauthorized (401)" },
      new Response(null, { status: 502 }),
    ),
    "NVIDIA API unauthorized (401)",
  )
  assert.match(
    extractApiError({ detail: "Authentication failed" }, new Response(null, { status: 502 })),
    /Authentication failed \(HTTP 502\)/u,
  )
})
