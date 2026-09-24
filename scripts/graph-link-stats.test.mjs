import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

function normalizeSlug(value) {
  return String(value)
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()
}

test("content index exposes a usable link graph for the UI", async () => {
  const indexPath = join(process.cwd(), "public/static/contentIndex.json")
  let raw
  try {
    raw = await readFile(indexPath, "utf8")
  } catch {
    test.skip("contentIndex.json missing — run npm run build first")
    return
  }

  const data = JSON.parse(raw)
  const slugs = new Set(Object.keys(data).map(normalizeSlug))
  let linkRefs = 0
  let resolved = 0

  for (const [slug, entry] of Object.entries(data)) {
    if (!entry || typeof entry !== "object") continue
    const source = normalizeSlug(slug)
    for (const link of entry.links ?? []) {
      linkRefs += 1
      const target = normalizeSlug(link)
      if (slugs.has(target)) resolved += 1
    }
  }

  assert.ok(slugs.size >= 200, `expected hundreds of nodes, got ${slugs.size}`)
  assert.ok(resolved >= 150, `expected at least 150 resolved edges, got ${resolved}`)
  assert.ok(
    resolved / Math.max(linkRefs, 1) > 0.3,
    `too many unresolved wikilinks (${resolved}/${linkRefs} resolved)`,
  )
})
