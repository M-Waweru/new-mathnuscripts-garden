import test from "node:test"
import assert from "node:assert/strict"
import { parseQuestion } from "./ask-core.mjs"

test("ask function exports stay compatible with handler tests", () => {
  assert.deepEqual(parseQuestion(JSON.stringify({ question: "What is the digital mind?" })), {
    question: "What is the digital mind?",
    context: undefined,
    history: [],
  })
})
