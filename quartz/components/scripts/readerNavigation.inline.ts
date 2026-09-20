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
  reader: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h11a3 3 0 0 1 3 3v13.5a.75.75 0 0 1-1.17.62L14 18.8l-3.83 2.32A.75.75 0 0 1 9 20.5V4.75A.75.75 0 0 0 8.25 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h1.5V5h-.5V4zm2.5 1.5v14.2l2.58-1.57a.75.75 0 0 1 .84 0L15 19.7V5.5H8.5z"/></svg>`,
  graph: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.5 16.5 10.5 12l3 2.5 3.5-5 2.5 3.5"/></svg>`,
  random: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 4.5A1.5 1.5 0 0 1 6.5 3H10v2H7.06l3.47 3.47-1.06 1.06L6 6.06V10H4V5.5zm14 0V10h-2V6.06l-3.47 3.47-1.06-1.06L17.94 5H14V3h3.5A1.5 1.5 0 0 1 19 4.5zM6.5 21A1.5 1.5 0 0 1 5 19.5V15h2v3.94l3.47-3.47 1.06 1.06L6.06 19H10v2H6.5zm11 0H14v-2h3.94l-3.47-3.47 1.06-1.06L19 17.94V14h2v5.5A1.5 1.5 0 0 1 19.5 21z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.05 6.05 12 10.94l4.95-4.89 1.41 1.41L13.41 12l4.95 4.95-1.41 1.41L12 13.41l-4.95 4.95-1.41-1.41L10.59 12 5.64 7.05z"/></svg>`,
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

function updateReaderProgress(progress: HTMLElement, essayIndex: number, totalEssays: number): void {
  const pageSuffix =
    readerPages.length > 1 ? ` · page ${readerPageIndex + 1}/${readerPages.length}` : ""
  progress.textContent = `Essay ${essayIndex + 1} / ${totalEssays}${pageSuffix}`
}

function showReaderPage(index: number, progress?: HTMLElement, essayIndex = 0, totalEssays = 1): void {
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
    document.getElementById("graph-explorer-stage")?.scrollIntoView({ behavior: "smooth", block: "start" })
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

function initGraphExplorer(): void {
  if (currentSlug() !== GRAPH_SLUG) {
    document.body.classList.remove("graph-explorer-active")
    return
  }

  document.body.classList.add("graph-explorer-active")
  const stage = document.getElementById("graph-explorer-stage")
  const sidebarGraph = document.querySelector(".right.sidebar .graph") as HTMLElement | null
  if (!stage) return
  if (!sidebarGraph) {
    window.setTimeout(initGraphExplorer, 300)
    return
  }
  if (stage.contains(sidebarGraph)) return

  stage.append(sidebarGraph)

  const localOuter = sidebarGraph.querySelector(".graph-outer") as HTMLElement | null
  if (localOuter) localOuter.hidden = true

  const globalOuter = sidebarGraph.querySelector(".global-graph-outer")
  const globalIcon = sidebarGraph.querySelector(".global-graph-icon") as HTMLButtonElement | null
  if (globalOuter && !globalOuter.classList.contains("active")) {
    globalIcon?.click()
  }
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
    createFabButton("garden-fab", "Reader mode", FAB_ICONS.reader, () => {
      toggleReaderMode()
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

  const toggleButton = createFabButton("garden-fab garden-fab-toggle", "More garden actions", FAB_ICONS.menu, () => {
    const expanded = stack.classList.toggle("garden-fab-stack-expanded")
    secondary.hidden = !expanded
    toggleButton.setAttribute("aria-expanded", expanded ? "true" : "false")
    toggleButton.innerHTML = `<span class="garden-fab-icon">${expanded ? FAB_ICONS.close : FAB_ICONS.menu}</span>`
    toggleButton.setAttribute("aria-label", expanded ? "Hide garden actions" : "More garden actions")
  })
  toggleButton.setAttribute("aria-expanded", "false")

  const askButton = createFabButton("garden-fab garden-fab-primary", "Ask Mathnuscripts", FAB_ICONS.ask, openAskDrawer)

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
      if (readerPageIndex > 0) showReaderPage(readerPageIndex - 1, progress, essayIndex, entries.length)
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
  document.addEventListener("readermodechange", handleReaderModeChange)
  syncReaderMode()

  cleanupCurrent = () => {
    document.removeEventListener("readermodechange", handleReaderModeChange)
    cleanupReaderChrome()
    if (isReaderMode()) setReaderMode(false)
  }

  if (typeof window.addCleanup === "function") {
    window.addCleanup(() => cleanupCurrent())
  }
}

document.addEventListener("nav", initReaderNavigation)
