import path from "node:path"

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
