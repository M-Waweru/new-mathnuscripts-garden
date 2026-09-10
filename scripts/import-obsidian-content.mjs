#!/usr/bin/env node

import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import process from "node:process"

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname)
const manifestPath = path.join(repoRoot, "scripts", "obsidian-publish-manifest.json")
const manifest = JSON.parse(await readFile(manifestPath, "utf8"))

function parseArgs(argv) {
  const result = { source: null, dryRun: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--source") result.source = argv[++i]
    else if (argv[i] === "--dry-run") result.dryRun = true
    else throw new Error(`Unknown argument: ${argv[i]}`)
  }
  return result
}

function assertSafeRelative(value, label) {
  const normalised = value.split(path.sep).join("/")
  if (!normalised || normalised.startsWith("/") || normalised.includes("..")) {
    throw new Error(`Unsafe ${label} path: ${value}`)
  }
  return normalised
}

function isPublished(markdown) {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return Boolean(frontmatter && /^dg-publish:\s*true\s*$/m.test(frontmatter[1]))
}

function convertMetadata(markdown) {
  return markdown.replace(/^(---\r?\n[\s\S]*?\r?\n---)(?:\r?\n|$)/, (block) =>
    block.replace(/^dg-publish:\s*true\s*$/m, "publish: true"),
  )
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(fullPath)))
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(fullPath)
  }
  return files
}

const { source, dryRun } = parseArgs(process.argv.slice(2))
if (!source) throw new Error("Usage: node scripts/import-obsidian-content.mjs --source <checkout> [--dry-run]")

const sourceRoot = path.resolve(source)
if (!existsSync(sourceRoot)) throw new Error(`Source checkout does not exist: ${sourceRoot}`)

const exclusions = new Set(manifest.excludeSourcePaths.map((item) => assertSafeRelative(item, "excluded")))
const siteManaged = new Set(manifest.siteManagedPaths.map((item) => assertSafeRelative(item, "site-managed")))
const files = []

for (const sourcePath of manifest.sourcePaths) {
  const safeSourcePath = assertSafeRelative(sourcePath, "source")
  const absolutePath = path.join(sourceRoot, safeSourcePath)
  if (!existsSync(absolutePath)) throw new Error(`Configured source path does not exist: ${absolutePath}`)
  for (const file of await walk(absolutePath)) {
    const relative = path.relative(sourceRoot, file).split(path.sep).join("/")
    if (!exclusions.has(relative)) files.push({ file, relative })
  }
}

const collisions = files.filter(({ relative }) => siteManaged.has(relative))
if (collisions.length) {
  throw new Error(`Refusing to overwrite site-managed paths: ${collisions.map(({ relative }) => relative).join(", ")}`)
}

const imported = []
const skipped = []
for (const { file, relative } of files.sort((a, b) => a.relative.localeCompare(b.relative))) {
  const contents = await readFile(file, "utf8")
  if (!isPublished(contents)) {
    skipped.push(relative)
    continue
  }
  const destination = path.join(repoRoot, manifest.targetRoot, relative)
  imported.push(relative)
  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, convertMetadata(contents), "utf8")
  }
}

console.log(`Published source files: ${imported.length}`)
console.log(`Skipped unpublished files: ${skipped.length}`)
console.log(`Mode: ${dryRun ? "dry-run" : "write"}`)
for (const relative of imported) console.log(`  ${dryRun ? "would import" : "imported"}: ${relative}`)
