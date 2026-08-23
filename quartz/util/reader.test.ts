import test from "node:test"
import assert from "node:assert/strict"
import { buildEssayReaderIndex } from "./reader"

test("buildEssayReaderIndex filters essays and orders them deterministically", () => {
  const result = buildEssayReaderIndex([
    {
      slug: "content/essays/zeta",
      relativePath: "Content/Essays/Zeta.md",
      frontmatter: { title: "Zeta" },
    },
    {
      slug: "content/notes/note",
      filePath: "Content/Notes/Note.md",
      frontmatter: { title: "Note" },
    },
    {
      slug: "content/essays/alpha",
      relativePath: "Content/Essays/Alpha.md",
      frontmatter: { title: "Alpha" },
    },
    {
      slug: "content/essays/index-of-essays",
      relativePath: "Content/Essays/Index of Essays.md",
      frontmatter: { title: "Index of Essays" },
    },
  ])

  assert.deepEqual(result, [
    { slug: "content/essays/alpha", title: "Alpha" },
    { slug: "content/essays/zeta", title: "Zeta" },
  ])
})
