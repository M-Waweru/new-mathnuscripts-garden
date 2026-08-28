import test from "node:test"
import assert from "node:assert/strict"
import { createAskResponse, parseQuestion } from "./ask.mjs"

test("parseQuestion accepts a bounded non-empty question", () => {
  assert.equal(
    parseQuestion(JSON.stringify({ question: " What is the digital mind? " })),
    "What is the digital mind?",
  )
})

test("parseQuestion rejects missing or oversized questions", () => {
  assert.throws(() => parseQuestion(JSON.stringify({})), /question is required/u)
  assert.throws(
    () => parseQuestion(JSON.stringify({ question: "x".repeat(2001) })),
    /question is too long/u,
  )
})

test("createAskResponse keeps provider generation explicit", () => {
  const response = createAskResponse("What is this?", [
    {
      id: "vision-1",
      title: "Vision",
      url: "/vision",
      heading: "Vision",
      text: "A living garden.",
    },
  ])

  assert.deepEqual(response, {
    status: "retrieval_ready",
    question: "What is this?",
    answer: null,
    sources: [
      {
        id: "vision-1",
        title: "Vision",
        url: "/vision",
        heading: "Vision",
        text: "A living garden.",
      },
    ],
    message: "Sources retrieved. ChatGPT generation will be enabled in the next pilot slice.",
  })
})
