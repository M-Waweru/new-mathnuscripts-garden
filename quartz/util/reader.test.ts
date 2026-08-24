import test from "node:test"
import assert from "node:assert/strict"
import { buildEssayReaderIndex, buildSiteNavigationIndex } from "./reader"

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

test("buildSiteNavigationIndex excludes virtual and index pages", () => {
  const result = buildSiteNavigationIndex([
    {
      slug: "content/notes/one",
      relativePath: "Content/Notes/One.md",
      frontmatter: { title: "One" },
    },
    {
      slug: "content/notes/index",
      relativePath: "Content/Notes/index.md",
      frontmatter: { title: "Notes" },
    },
    { slug: "tags/writing", relativePath: "tags/writing", frontmatter: { title: "Writing" } },
  ])

  assert.deepEqual(result, [{ slug: "content/notes/one", title: "One" }])
})
