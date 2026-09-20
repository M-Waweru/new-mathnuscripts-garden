import test from "node:test"
import assert from "node:assert/strict"
import { buildAskContext, buildAskApiUrl } from "./AskMathnuscripts"

test("buildAskContext includes the current note title and selected text", () => {
  const context = buildAskContext(
    "Digital Mind",
    "The garden is a living intellectual environment.",
  )

  assert.deepEqual(context, {
    title: "Digital Mind",
    selection: "The garden is a living intellectual environment.",
  })
})

test("buildAskContext trims empty selections", () => {
  const context = buildAskContext("Vision", "   ")

  assert.deepEqual(context, { title: "Vision", selection: "" })
})

test("buildAskApiUrl respects site base path", () => {
  assert.equal(buildAskApiUrl(""), "/api/ask")
  assert.equal(buildAskApiUrl("/garden"), "/garden/api/ask")
})
