import { QuartzPluginData } from "../plugins/vfile"

export type GardenStatEntry = {
  slug: string
  title: string
  date: string
  words: number
}

export type GardenStats = {
  notes: number
  words: number
  latest: GardenStatEntry[]
}

function textFromAst(node: unknown): string {
  if (!node || typeof node !== "object") return ""
  const value = "value" in node && typeof node.value === "string" ? node.value : ""
  const children = "children" in node && Array.isArray(node.children) ? node.children : []
  return `${value} ${children.map(textFromAst).join(" ")}`
}

function wordCount(data: QuartzPluginData): number {
  const source =
    typeof data.text === "string"
      ? data.text
      : textFromAst((data as QuartzPluginData & { htmlAst?: unknown }).htmlAst)
  return source.trim() ? source.trim().split(/\s+/u).length : 0
}

function dateValue(data: QuartzPluginData): string {
  const frontmatter = data.frontmatter as Record<string, unknown> | undefined
  const date =
    frontmatter?.dateModified ?? frontmatter?.modified ?? frontmatter?.date ?? data.created
  return date instanceof Date ? date.toISOString() : typeof date === "string" ? date : ""
}

export function buildGardenStats(allFiles: QuartzPluginData[]): GardenStats {
  const entries = allFiles
    .filter((data) => typeof data.slug === "string" && !data.slug.startsWith("tags/"))
    .map((data) => ({
      slug: data.slug as string,
      title: String(data.frontmatter?.title ?? data.slug),
      date: dateValue(data),
      words: wordCount(data),
    }))

  return {
    notes: entries.length,
    words: entries.reduce((total, entry) => total + entry.words, 0),
    latest: entries
      .filter((entry) => entry.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8),
  }
}
