import { applyGraphEdgeLightgrayOverride } from "../../util/graphEdgeTheme"

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

const GRAPH_SLUG = "graph-explorer"
const READER_PENDING_KEY = "mathnuscripts:reader-pending"

const FAB_ICONS = {
  ask: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2zm6 8 1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1 1-2.8zm-9 4 1.1 3.2L13 19l-3.4 1.2L9 23l-1.1-3.2L4 19l3.4-1.2L9 14z"/></svg>`,
  graph: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="19" r="2.2" fill="currentColor"/><circle cx="19" cy="17" r="2.2" fill="currentColor"/><circle cx="12" cy="5" r="2.2" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6.8 17.2 10.5 6.8M13.5 6.5 17.2 15.2M7 18.5h10"/></svg>`,
  random: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="1.35" fill="currentColor"/><circle cx="16" cy="8" r="1.35" fill="currentColor"/><circle cx="12" cy="12" r="1.35" fill="currentColor"/><circle cx="7" cy="16" r="1.35" fill="currentColor"/><circle cx="17" cy="15" r="1.35" fill="currentColor"/></svg>`,
  expand: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 15.5 6.5 10h11L12 15.5z"/></svg>`,
  collapse: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 8.5 17.5 14h-11L12 8.5z"/></svg>`,
} as const

let cleanupCurrent = () => {}
let cleanupFab = () => {}
let cleanupReaderChrome = () => {}
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

function setReaderMode(on: boolean): void {
  const mode = on ? "on" : "off"
  document.documentElement.setAttribute("reader-mode", mode)
  dispatch("readermodechange", { mode })
}

function toggleReaderMode(): void {
  if (isReaderMode()) {
    setReaderMode(false)
    return
  }
  enterReaderMode()
}

function enterReaderMode(): void {
  const entries = getReaderIndex()
  if (entries.length === 0) return
  const onEssay = entries.some((entry) => entry.slug === currentSlug())
  if (!onEssay) {
    sessionStorage.setItem(READER_PENDING_KEY, "1")
    navigateTo(entries[0])
    return
  }
  setReaderMode(true)
}

function toggleTheme(): void {
  const theme = document.documentElement.getAttribute("saved-theme") === "dark" ? "light" : "dark"
  document.documentElement.setAttribute("saved-theme", theme)
  document.body.classList.remove("theme-dark", "theme-light")
  document.body.classList.add(`theme-${theme}`)
  localStorage.setItem("theme", theme)
  applyGraphEdgeLightgrayOverride()
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

function updateReaderProgress(
  progress: HTMLElement,
  essayIndex: number,
  totalEssays: number,
): void {
  const pageSuffix =
    readerPages.length > 1 ? ` · page ${readerPageIndex + 1}/${readerPages.length}` : ""
  progress.textContent = `Essay ${essayIndex + 1} / ${totalEssays}${pageSuffix}`
}

function showReaderPage(
  index: number,
  progress?: HTMLElement,
  essayIndex = 0,
  totalEssays = 1,
): void {
  if (readerPages.length === 0) return
  readerPageIndex = Math.max(0, Math.min(index, readerPages.length - 1))
  readerPages.forEach((page, pageIndex) => {
    page.hidden = pageIndex !== readerPageIndex
  })
  if (progress) updateReaderProgress(progress, essayIndex, totalEssays)
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
}

function handleToolbarClick(event: MouseEvent): void {
  const target = event.target as Element | null
  const readerButton = target?.closest(".readermode")
  const themeButton = target?.closest(".darkmode")
  if (!readerButton && !themeButton) return

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

function openGraphExplorer(): void {
  if (currentSlug() === GRAPH_SLUG) {
    document
      .getElementById("graph-explorer-stage")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
    return
  }
  navigateTo({ slug: GRAPH_SLUG, title: "Garden Graph" })
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

let graphExplorerEmbedAttempts = 0

function findExplorerGraphRoot(): HTMLElement | null {
  return (
    (document.querySelector("#graph-explorer-stage .graph") as HTMLElement | null) ??
    (document.querySelector(".right.sidebar .graph") as HTMLElement | null)
  )
}

function requestGraphPluginRender(): void {
  applyGraphEdgeLightgrayOverride()
  document.dispatchEvent(new CustomEvent<{}>("render"))
}

function scheduleGraphPluginRender(): void {
  applyGraphEdgeLightgrayOverride()
  requestGraphPluginRender()
  window.requestAnimationFrame(() => {
    requestGraphPluginRender()
    window.requestAnimationFrame(requestGraphPluginRender)
  })
}

function mountGlobalGraphInStage(stage: HTMLElement, graphRoot: HTMLElement): void {
  if (!stage.contains(graphRoot)) {
    stage.append(graphRoot)
  }

  const localOuter = graphRoot.querySelector(".graph-outer") as HTMLElement | null
  if (localOuter) localOuter.hidden = true

  const globalOuter = graphRoot.querySelector(".global-graph-outer") as HTMLElement | null
  if (!globalOuter) return

  globalOuter.classList.add("active")
  scheduleGraphPluginRender()
}

function initGraphExplorer(): void {
  if (currentSlug() !== GRAPH_SLUG) {
    graphExplorerEmbedAttempts = 0
    document.body.classList.remove("graph-explorer-active")
    return
  }

  document.body.classList.add("graph-explorer-active")
  const stage = document.getElementById("graph-explorer-stage")
  if (!stage) return

  const graphRoot = findExplorerGraphRoot()
  if (!graphRoot) {
    graphExplorerEmbedAttempts += 1
    if (graphExplorerEmbedAttempts < 30) {
      window.setTimeout(initGraphExplorer, 300)
    }
    return
  }

  graphExplorerEmbedAttempts = 0
  mountGlobalGraphInStage(stage, graphRoot)
}

function createFabButton(
  className: string,
  label: string,
  icon: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button")
  button.type = "button"
  button.className = className
  button.setAttribute("aria-label", label)
  button.innerHTML = `<span class="garden-fab-icon">${icon}</span>`
  button.addEventListener("click", onClick)
  return button
}

function openAskDrawer(): void {
  document.dispatchEvent(new CustomEvent<{}>("mathnuscripts:open-ask"))
}

function initGardenFabStack(): void {
  cleanupFab()

  const stack = document.createElement("nav")
  stack.className = "garden-fab-stack"
  stack.setAttribute("aria-label", "Garden controls")

  const secondary = document.createElement("div")
  secondary.className = "garden-fab-secondary"
  secondary.hidden = true

  const siteIndex = getSiteIndex()

  secondary.append(
    createFabButton("garden-fab", "Random note", FAB_ICONS.random, () => {
      const candidates = siteIndex.filter((entry) => entry.slug !== currentSlug())
      navigateTo(candidates[Math.floor(Math.random() * candidates.length)] ?? siteIndex[0])
      stack.classList.remove("garden-fab-stack-expanded")
      secondary.hidden = true
      toggleButton.setAttribute("aria-expanded", "false")
    }),
    createFabButton("garden-fab", "Garden graph", FAB_ICONS.graph, () => {
      openGraphExplorer()
      stack.classList.remove("garden-fab-stack-expanded")
      secondary.hidden = true
      toggleButton.setAttribute("aria-expanded", "false")
    }),
  )

  const toggleButton = createFabButton(
    "garden-fab garden-fab-toggle",
    "More garden actions",
    FAB_ICONS.expand,
    () => {
      const expanded = stack.classList.toggle("garden-fab-stack-expanded")
      secondary.hidden = !expanded
      toggleButton.setAttribute("aria-expanded", expanded ? "true" : "false")
      toggleButton.innerHTML = `<span class="garden-fab-icon">${expanded ? FAB_ICONS.collapse : FAB_ICONS.expand}</span>`
      toggleButton.setAttribute(
        "aria-label",
        expanded ? "Hide garden actions" : "More garden actions",
      )
    },
  )
  toggleButton.setAttribute("aria-expanded", "false")

  const askButton = createFabButton(
    "garden-fab garden-fab-primary",
    "Ask Mathnuscripts",
    FAB_ICONS.ask,
    openAskDrawer,
  )

  stack.append(secondary, toggleButton, askButton)
  document.body.append(stack)
  document.body.classList.add("garden-fab-active")

  cleanupFab = () => {
    stack.remove()
    document.body.classList.remove("garden-fab-active")
    cleanupFab = () => {}
  }
}

function installToolbarFallback(): void {
  if (toolbarFallbackInstalled) return
  toolbarFallbackInstalled = true
  document.addEventListener("click", handleToolbarClick, true)
}

function mountReaderChrome(entries: ReaderIndex, essayIndex: number): void {
  cleanupReaderChrome()

  const previous = entries[essayIndex - 1]
  const next = entries[essayIndex + 1]

  const nav = document.createElement("nav")
  nav.className = "reader-nav"
  nav.setAttribute("aria-label", "Reader navigation")

  const progress = document.createElement("span")
  progress.className = "reader-nav-progress"
  updateReaderProgress(progress, essayIndex, entries.length)

  const exitButton = document.createElement("button")
  exitButton.type = "button"
  exitButton.className = "reader-nav-button reader-nav-exit"
  exitButton.textContent = "Exit"
  exitButton.setAttribute("aria-label", "Exit reader mode")
  exitButton.addEventListener("click", () => setReaderMode(false))

  const previousButton = document.createElement("button")
  previousButton.type = "button"
  previousButton.className = "reader-nav-button reader-nav-previous"
  previousButton.textContent = "Previous"
  previousButton.setAttribute("aria-label", "Previous essay")

  const nextButton = document.createElement("button")
  nextButton.type = "button"
  nextButton.className = "reader-nav-button reader-nav-next"
  nextButton.textContent = "Next"
  nextButton.setAttribute("aria-label", "Next essay")

  const syncReaderControls = () => {
    previousButton.disabled = readerPageIndex === 0 && !previous
    nextButton.disabled = readerPageIndex >= readerPages.length - 1 && !next
  }

  previousButton.addEventListener("click", () => {
    if (readerPages.length > 0 && readerPageIndex > 0) {
      showReaderPage(readerPageIndex - 1, progress, essayIndex, entries.length)
      syncReaderControls()
      return
    }
    navigateTo(previous)
  })

  nextButton.addEventListener("click", () => {
    if (readerPages.length > 0 && readerPageIndex < readerPages.length - 1) {
      showReaderPage(readerPageIndex + 1, progress, essayIndex, entries.length)
      syncReaderControls()
      return
    }
    navigateTo(next)
  })

  nav.append(exitButton, previousButton, progress, nextButton)
  document.body.append(nav)
  document.body.classList.add("reader-navigation-active")

  createReaderPages()
  showReaderPage(readerPageIndex, progress, essayIndex, entries.length)
  syncReaderControls()

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isReaderMode() || event.defaultPrevented) return
    const target = event.target as HTMLElement | null
    if (target?.matches("input, textarea, select, button, a, [contenteditable='true']")) return
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (event.key === "ArrowLeft" && (readerPageIndex > 0 || previous)) {
      event.preventDefault()
      if (readerPageIndex > 0)
        showReaderPage(readerPageIndex - 1, progress, essayIndex, entries.length)
      else navigateTo(previous)
      syncReaderControls()
    } else if (event.key === "ArrowRight" && (readerPageIndex < readerPages.length - 1 || next)) {
      event.preventDefault()
      if (readerPages.length > 0 && readerPageIndex < readerPages.length - 1) {
        showReaderPage(readerPageIndex + 1, progress, essayIndex, entries.length)
      } else {
        navigateTo(next)
      }
      syncReaderControls()
    } else if (event.key === "Escape") {
      event.preventDefault()
      setReaderMode(false)
    }
  }

  document.addEventListener("keydown", handleKeydown)

  cleanupReaderChrome = () => {
    document.removeEventListener("keydown", handleKeydown)
    nav.remove()
    document.body.classList.remove("reader-navigation-active")
    restoreReaderPages()
    cleanupReaderChrome = () => {}
  }
}

function syncReaderMode(): void {
  const entries = getReaderIndex()
  const essayIndex = entries.findIndex((entry) => entry.slug === currentSlug())

  if (!isReaderMode()) {
    cleanupReaderChrome()
    return
  }

  if (essayIndex < 0) {
    setReaderMode(false)
    return
  }

  mountReaderChrome(entries, essayIndex)
}

function initReaderNavigation(): void {
  cleanupCurrent()
  cleanupFab()
  cleanupReaderChrome()
  applyGraphEdgeLightgrayOverride()
  installToolbarFallback()
  initGardenFabStack()
  renderGardenOverview()
  initGraphExplorer()

  if (sessionStorage.getItem(READER_PENDING_KEY) === "1") {
    sessionStorage.removeItem(READER_PENDING_KEY)
    const entries = getReaderIndex()
    if (entries.some((entry) => entry.slug === currentSlug())) {
      setReaderMode(true)
    }
  }

  const handleReaderModeChange = () => syncReaderMode()
  const handleThemeChange = () => applyGraphEdgeLightgrayOverride()
  document.addEventListener("readermodechange", handleReaderModeChange)
  document.addEventListener("themechange", handleThemeChange, true)
  syncReaderMode()

  cleanupCurrent = () => {
    document.removeEventListener("readermodechange", handleReaderModeChange)
    document.removeEventListener("themechange", handleThemeChange, true)
    cleanupReaderChrome()
    if (isReaderMode()) setReaderMode(false)
  }

  if (typeof window.addCleanup === "function") {
    window.addCleanup(() => cleanupCurrent())
  }
}

document.addEventListener("nav", initReaderNavigation)
