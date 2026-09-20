type ReaderEntry = {
  slug: string
  title: string
}

type ReaderIndex = ReaderEntry[]

type GardenStats = {
  notes: number
  words: number
  latest: Array<{ slug: string; title: string; date: string; words: number }>
}

let cleanupCurrent = () => {}
let cleanupMenu = () => {}
let toolbarFallbackInstalled = false
let readerPages: HTMLElement[] = []
let readerPageIndex = 0
let readerArticle: HTMLElement | null = null

function currentSlug(): string {
  return (document.body.dataset.slug ?? "").replace(/^\/+|\/+$/g, "")
}

function readIndex(id: string): ReaderIndex {
  const element = document.getElementById(id)
  if (!element?.textContent) return []

  try {
    const parsed = JSON.parse(element.textContent)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getReaderIndex(): ReaderIndex {
  return readIndex("essay-reader-index")
}

function getSiteIndex(): ReaderIndex {
  return readIndex("site-navigation-index")
}

function getGardenStats(): GardenStats | undefined {
  const element = document.getElementById("garden-stats")
  if (!element?.textContent) return undefined
  try {
    return JSON.parse(element.textContent) as GardenStats
  } catch {
    return undefined
  }
}

function buildHref(slug: string): string {
  const basePath = document.body.dataset.basepath ?? ""
  return `${basePath}/${slug}`.replace(/\/+/g, "/")
}

function isReaderMode(): boolean {
  return document.documentElement.getAttribute("reader-mode") === "on"
}

function dispatch(name: string, detail: Record<string, string>): void {
  document.dispatchEvent(new CustomEvent(name, { detail }))
}

function toggleReaderMode(): void {
  const mode = isReaderMode() ? "off" : "on"
  document.documentElement.setAttribute("reader-mode", mode)
  dispatch("readermodechange", { mode })
}

function toggleTheme(): void {
  const theme = document.documentElement.getAttribute("saved-theme") === "dark" ? "light" : "dark"
  document.documentElement.setAttribute("saved-theme", theme)
  document.body.classList.remove("theme-dark", "theme-light")
  document.body.classList.add(`theme-${theme}`)
  localStorage.setItem("theme", theme)
  dispatch("themechange", { theme })
}

function createReaderPages(): void {
  if (readerPages.length > 0) return
  const article = document.querySelector(".center > article") as HTMLElement | null
  if (!article || article.children.length === 0) return

  readerArticle = article
  let page: HTMLDivElement | undefined
  let characters = 0
  for (const child of Array.from(article.children)) {
    const size = child.textContent?.length ?? 0
    if (!page || (characters >= 1800 && page.children.length > 0)) {
      page = document.createElement("div")
      page.className = "reader-page"
      article.append(page)
      readerPages.push(page)
      characters = 0
    }
    page.append(child)
    characters += size
  }
}

function restoreReaderPages(): void {
  if (!readerArticle || readerPages.length === 0) return
  const fragment = document.createDocumentFragment()
  for (const page of readerPages) {
    while (page.firstChild) fragment.append(page.firstChild)
    page.remove()
  }
  readerArticle.append(fragment)
  readerPages = []
  readerPageIndex = 0
  readerArticle = null
}

function showReaderPage(index: number, progress?: HTMLElement): void {
  if (readerPages.length === 0) return
  readerPageIndex = Math.max(0, Math.min(index, readerPages.length - 1))
  readerPages.forEach((page, pageIndex) => {
    page.hidden = pageIndex !== readerPageIndex
  })
  if (progress) progress.textContent = `Page ${readerPageIndex + 1} / ${readerPages.length}`
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
}

function handleToolbarClick(event: MouseEvent): void {
  const target = event.target as Element | null
  const readerButton = target?.closest(".readermode")
  const themeButton = target?.closest(".darkmode")
  if (!readerButton && !themeButton) return

  // Own these controls so the package listeners cannot toggle twice.
  event.preventDefault()
  event.stopImmediatePropagation()
  if (readerButton) toggleReaderMode()
  if (themeButton) toggleTheme()
}

function navigateTo(entry: ReaderEntry | undefined): void {
  if (!entry) return
  const href = buildHref(entry.slug)
  if (window.spaNavigate) window.spaNavigate(new URL(href, window.location.origin))
  else window.location.href = href
}

function renderGardenOverview(): void {
  const target = document.getElementById("garden-stats-grid")
  if (!target) return
  const stats = getGardenStats()
  if (!stats) return

  target.replaceChildren()
  const cards = [
    ["Notes", stats.notes.toLocaleString()],
    ["Words", stats.words.toLocaleString()],
    ["Latest updates", stats.latest.length.toLocaleString()],
  ]
  for (const [label, value] of cards) {
    const card = document.createElement("div")
    card.className = "garden-stat-card"
    const number = document.createElement("strong")
    number.textContent = value
    const caption = document.createElement("span")
    caption.textContent = label
    card.append(number, caption)
    target.append(card)
  }

  const latest = document.getElementById("garden-latest-updates")
  if (!latest) return
  latest.replaceChildren()
  for (const entry of stats.latest) {
    const item = document.createElement("li")
    const link = document.createElement("a")
    link.href = buildHref(entry.slug)
    link.textContent = entry.title
    const date = document.createElement("time")
    date.dateTime = entry.date
    date.textContent = entry.date ? new Date(entry.date).toLocaleDateString() : ""
    item.append(link, date)
    latest.append(item)
  }
}

function createButton(
  className: string,
  label: string,
  entry: ReaderEntry | undefined,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button")
  button.type = "button"
  button.className = className
  button.setAttribute("aria-label", label)
  button.textContent = entry ? label : ""
  button.disabled = !entry
  button.addEventListener("click", onClick)
  return button
}

function installToolbarFallback(): void {
  if (toolbarFallbackInstalled) return
  toolbarFallbackInstalled = true
  document.addEventListener("click", handleToolbarClick, true)
}

function addDockAction(
  dock: HTMLElement,
  options: {
    id: string
    label: string
    description: string
    icon: string
    primary?: boolean
    onClick: () => void
  },
): HTMLButtonElement {
  const item = document.createElement("button")
  item.type = "button"
  item.className = "garden-dock-action"
  if (options.primary) item.classList.add("garden-dock-action-primary")
  item.dataset.action = options.id
  item.setAttribute("aria-label", `${options.label}. ${options.description}`)
  item.innerHTML = `<span class="garden-dock-icon" aria-hidden="true">${options.icon}</span><span class="garden-dock-label">${options.label}</span>`
  item.addEventListener("click", options.onClick)
  dock.append(item)
  return item
}

function openAskDrawer(): void {
  document.dispatchEvent(new CustomEvent<{}>("mathnuscripts:open-ask"))
}

function initGardenDock(): void {
  cleanupMenu()

  const dock = document.createElement("nav")
  dock.className = "garden-dock"
  dock.setAttribute("aria-label", "Garden controls")

  const siteIndex = getSiteIndex()

  addDockAction(dock, {
    id: "random",
    label: "Random",
    description: "Open a surprise note from the garden",
    icon: "🎲",
    onClick: () => {
      const candidates = siteIndex.filter((entry) => entry.slug !== currentSlug())
      navigateTo(candidates[Math.floor(Math.random() * candidates.length)] ?? siteIndex[0])
    },
  })

  addDockAction(dock, {
    id: "reader",
    label: "Reader",
    description: "Read essays like a book",
    icon: "📖",
    onClick: () => toggleReaderMode(),
  })

  addDockAction(dock, {
    id: "graph",
    label: "Graph",
    description: "Explore connected notes",
    icon: "🕸",
    onClick: () => {
      if (currentSlug() === "content/graph-explorer") {
        document
          .querySelector(".global-graph-outer")
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        navigateTo({ slug: "content/graph-explorer", title: "Garden Overview" })
      }
    },
  })

  addDockAction(dock, {
    id: "ask",
    label: "Ask",
    description: "Ask cited questions over the garden",
    icon: "✦",
    primary: true,
    onClick: openAskDrawer,
  })

  document.body.append(dock)
  document.body.classList.add("garden-dock-active")

  cleanupMenu = () => {
    dock.remove()
    document.body.classList.remove("garden-dock-active")
    cleanupMenu = () => {}
  }
}

function initReaderNavigation(): void {
  cleanupCurrent()
  cleanupMenu()
  installToolbarFallback()
  initGardenDock()
  renderGardenOverview()

  const entries = getReaderIndex()
  const index = entries.findIndex((entry) => entry.slug === currentSlug())
  if (index < 0) return

  const previous = entries[index - 1]
  const next = entries[index + 1]

  const nav = document.createElement("nav")
  nav.className = "reader-nav"
  nav.setAttribute("aria-label", "Reader page navigation")

  const progress = document.createElement("span")
  progress.className = "reader-nav-progress"
  progress.textContent = `${index + 1} / ${entries.length}`

  const previousButton = createButton(
    "reader-nav-button reader-nav-previous",
    "Previous page",
    previous,
    () => {
      if (readerPages.length > 0 && readerPageIndex > 0)
        showReaderPage(readerPageIndex - 1, progress)
      else navigateTo(previous)
    },
  )
  const nextButton = createButton("reader-nav-button reader-nav-next", "Next page", next, () => {
    if (readerPages.length > 0 && readerPageIndex < readerPages.length - 1)
      showReaderPage(readerPageIndex + 1, progress)
    else navigateTo(next)
  })
  nav.append(previousButton, progress, nextButton)

  const previousEdge = createButton(
    "reader-edge reader-edge-previous",
    "Previous page",
    previous,
    () => {
      if (readerPages.length > 0 && readerPageIndex > 0)
        showReaderPage(readerPageIndex - 1, progress)
      else navigateTo(previous)
    },
  )
  const nextEdge = createButton("reader-edge reader-edge-next", "Next page", next, () => {
    if (readerPages.length > 0 && readerPageIndex < readerPages.length - 1)
      showReaderPage(readerPageIndex + 1, progress)
    else navigateTo(next)
  })

  document.body.append(nav, previousEdge, nextEdge)

  const updateVisibility = () => {
    const active = isReaderMode()
    if (active) {
      createReaderPages()
      showReaderPage(readerPageIndex, progress)
    } else {
      restoreReaderPages()
    }
    document.body.classList.toggle("reader-navigation-active", active)
    previousButton.disabled = !active || (readerPageIndex === 0 && !previous)
    nextButton.disabled =
      !active ||
      (readerPages.length > 0 ? readerPageIndex >= readerPages.length - 1 && !next : !next)
    previousEdge.disabled = !active || (readerPageIndex === 0 && !previous)
    nextEdge.disabled =
      !active ||
      (readerPages.length > 0 ? readerPageIndex >= readerPages.length - 1 && !next : !next)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isReaderMode() || event.defaultPrevented) return
    const target = event.target as HTMLElement | null
    if (target?.matches("input, textarea, select, button, a, [contenteditable='true']")) return
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (event.key === "ArrowLeft" && (readerPageIndex > 0 || previous)) {
      event.preventDefault()
      if (readerPageIndex > 0) showReaderPage(readerPageIndex - 1, progress)
      else navigateTo(previous)
    } else if (event.key === "ArrowRight" && (readerPageIndex < readerPages.length - 1 || next)) {
      event.preventDefault()
      if (readerPages.length > 0 && readerPageIndex < readerPages.length - 1)
        showReaderPage(readerPageIndex + 1, progress)
      else navigateTo(next)
    }
  }

  const handleReaderModeChange = () => updateVisibility()
  document.addEventListener("keydown", handleKeydown)
  document.addEventListener("readermodechange", handleReaderModeChange)
  updateVisibility()

  cleanupCurrent = () => {
    document.removeEventListener("keydown", handleKeydown)
    document.removeEventListener("readermodechange", handleReaderModeChange)
    nav.remove()
    previousEdge.remove()
    nextEdge.remove()
    document.body.classList.remove("reader-navigation-active")
    restoreReaderPages()
  }

  window.addCleanup(() => cleanupCurrent())
}

document.addEventListener("nav", initReaderNavigation)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReaderNavigation, { once: true })
} else {
  initReaderNavigation()
}
