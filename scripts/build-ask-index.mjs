import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildAskIndex } from "./ask-index-core.mjs"

export { buildAskIndex, rankChunks } from "./ask-index-core.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CONTENT_DIR = path.join(ROOT, "content")
const OUTPUT_FILE = path.join(ROOT, "quartz", "static", "ask-index.json")
const IGNORED_PARTS = new Set(["private", "templates", ".obsidian"])

function collectMarkdownFiles(directory, relativeDirectory = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name)
    if (IGNORED_PARTS.has(entry.name)) return []
    if (entry.isDirectory())
      return collectMarkdownFiles(path.join(directory, entry.name), relativePath)
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) return []
    return [{ relativePath, content: fs.readFileSync(path.join(directory, entry.name), "utf8") }]
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const index = buildAskIndex(collectMarkdownFiles(CONTENT_DIR))
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(index, null, 2)}\n`)
  console.log(
    `Wrote ${index.chunks.length} Ask Mathnuscripts chunks to ${path.relative(ROOT, OUTPUT_FILE)}`,
  )
}
