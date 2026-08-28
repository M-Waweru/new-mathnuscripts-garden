import test from "node:test"
import assert from "node:assert/strict"
import { buildAskIndex, rankChunks } from "./build-ask-index.mjs"

test("buildAskIndex creates citation-ready chunks from published markdown", () => {
  const index = buildAskIndex([
    {
      relativePath: "Content/Digital Mind.md",
      content:
        "# Digital Mind\n\nThe garden externalises memory.\n\nIt connects ideas across time.",
    },
  ])

  assert.equal(index.version, 1)
  assert.equal(index.chunks.length, 2)
  assert.deepEqual(index.chunks[0], {
    id: "content-digital-mind-1",
    title: "Digital Mind",
    url: "/content/digital-mind",
    heading: "Digital Mind",
    text: "The garden externalises memory.",
  })
})

test("rankChunks returns the most relevant chunks with deterministic scores", () => {
  const index = buildAskIndex([
    { relativePath: "Vision.md", content: "# Vision\n\nA garden for lifelong learning." },
    { relativePath: "Cooking.md", content: "# Cooking\n\nA recipe for bread." },
  ])

  const results = rankChunks(index.chunks, "garden lifelong learning", 2)

  assert.equal(results.length, 1)
  assert.equal(results[0].title, "Vision")
  assert.ok(results[0].score > 0)
})
