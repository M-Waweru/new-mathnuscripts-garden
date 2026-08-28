import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CONTENT_DIR = path.join(ROOT, "content")
const OUTPUT_FILE = path.join(ROOT, "quartz", "static", "ask-index.json")
const IGNORED_PARTS = new Set(["private", "templates", ".obsidian"])

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function tokenize(value) {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

function stripFrontmatter(value) {
  return value.replace(/^---[\s\S]*?---\s*/u, "")
}

function parseMarkdown(relativePath, content) {
  const clean = stripFrontmatter(content)
  const fileTitle = path.basename(relativePath, path.extname(relativePath))
  const headingMatch = clean.match(/^#\s+(.+)$/mu)
  const title = headingMatch?.[1]?.trim() || fileTitle
  const url = `/` + relativePath.replace(/\.md$/i, "").split(path.sep).map(slugify).join("/")
  const chunks = []
  let heading = title
  let chunkNumber = 0

  for (const block of clean.split(/\n\s*\n/u)) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) continue

    const headingLine = lines.find((line) => /^#{1,6}\s+/u.test(line))
    if (headingLine) {
      heading = headingLine.replace(/^#{1,6}\s+/u, "").trim()
    }
    const text = lines
      .filter((line) => !/^#{1,6}\s+/u.test(line))
      .join(" ")
      .replace(/[*_`]/g, "")
      .trim()
    if (!text) continue

    chunkNumber += 1
    chunks.push({
      id: `${slugify(relativePath.replace(/\.md$/i, ""))}-${chunkNumber}`,
      title,
      url,
      heading,
      text,
    })
  }

  return chunks
}

export function buildAskIndex(files) {
  const chunks = files.flatMap(({ relativePath, content }) => parseMarkdown(relativePath, content))
  return { version: 1, chunks }
}

export function rankChunks(chunks, query, limit = 5) {
  const queryTokens = new Set(tokenize(query))
  if (queryTokens.size === 0) return []

  return chunks
    .map((chunk) => {
      const titleTokens = tokenize(chunk.title)
      const bodyTokens = tokenize(`${chunk.heading} ${chunk.text}`)
      const score = [...queryTokens].reduce(
        (total, token) =>
          total +
          (titleTokens.includes(token) ? 4 : 0) +
          bodyTokens.filter((candidate) => candidate === token).length,
        0,
      )
      return { ...chunk, score }
    })
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit)
}

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
