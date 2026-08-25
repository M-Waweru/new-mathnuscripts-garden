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
  localStorage.setItem("theme", theme)
  document.body.classList.remove("theme-dark", "theme-light")
  document.body.classList.add(`theme-${theme}`)
  dispatch("themechange", { theme })
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

  document.addEventListener("click", (event) => {
    const target = event.target as Element | null
    const readerButton = target?.closest(".readermode")
    const themeButton = target?.closest(".darkmode")
    if (!readerButton && !themeButton) return

    const beforeReader = isReaderMode()
    const beforeTheme = document.documentElement.getAttribute("saved-theme")
    window.setTimeout(() => {
      if (readerButton && isReaderMode() === beforeReader) toggleReaderMode()
      if (themeButton && document.documentElement.getAttribute("saved-theme") === beforeTheme)
        toggleTheme()
    }, 0)
  })
}

function addMenuItem(
  menu: HTMLElement,
  label: string,
  description: string,
  onClick: () => void,
  disabled = false,
): void {
  const item = document.createElement("button")
  item.type = "button"
  item.className = "mathnuscripts-menu-item"
  item.disabled = disabled
  item.innerHTML = `<strong>${label}</strong><span>${description}</span>`
  item.addEventListener("click", onClick)
  menu.append(item)
}

function initMathnuscriptsMenu(): void {
  cleanupMenu()

  const wrapper = document.createElement("div")
  wrapper.className = "mathnuscripts-menu-wrapper mathnuscripts-menu-floating"
  const minimized = localStorage.getItem("mathnuscripts-controls-minimized") === "true"
  if (minimized) wrapper.classList.add("is-minimized")

  const toggle = document.createElement("button")
  toggle.type = "button"
  toggle.className = "mathnuscripts-menu-toggle"
  toggle.setAttribute("aria-label", "Open Mathnuscripts menu")
  toggle.setAttribute("aria-expanded", "false")
  toggle.textContent = "☰"
  toggle.title = "Open Mathnuscripts controls"

  const menu = document.createElement("div")
  menu.className = "mathnuscripts-menu"
  menu.setAttribute("aria-label", "Mathnuscripts views")
  menu.hidden = true

  const minimize = document.createElement("button")
  minimize.type = "button"
  minimize.className = "mathnuscripts-menu-minimize"
  minimize.setAttribute("aria-label", "Minimize Mathnuscripts controls")
  minimize.textContent = "Minimize controls"

  const close = () => {
    menu.hidden = true
    toggle.setAttribute("aria-expanded", "false")
  }

  const siteIndex = getSiteIndex()
  menu.append(minimize)
  addMenuItem(menu, "Random note", "Open a surprise from the garden", () => {
    const candidates = siteIndex.filter((entry) => entry.slug !== currentSlug())
    navigateTo(candidates[Math.floor(Math.random() * candidates.length)] ?? siteIndex[0])
  })
  addMenuItem(menu, "Reader Mode", "Read essays like a book", () => {
    toggleReaderMode()
    close()
  })
  addMenuItem(menu, "Graph Explorer", "Jump to the connected notes", () => {
    if (currentSlug() === "content/graph-explorer") {
      document
        .querySelector(".global-graph-outer")
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    } else {
      navigateTo({ slug: "content/graph-explorer", title: "Garden Overview" })
    }
    close()
  })
  addMenuItem(
    menu,
    "Ask Mathnuscripts",
    "Coming next: cited questions over the garden",
    () => {},
    true,
  )

  toggle.addEventListener("click", () => {
    if (wrapper.classList.contains("is-minimized")) {
      wrapper.classList.remove("is-minimized")
      menu.hidden = false
      toggle.setAttribute("aria-expanded", "true")
      localStorage.setItem("mathnuscripts-controls-minimized", "false")
      return
    }
    menu.hidden = !menu.hidden
    toggle.setAttribute("aria-expanded", String(!menu.hidden))
  })

  minimize.addEventListener("click", () => {
    menu.hidden = true
    toggle.setAttribute("aria-expanded", "false")
    wrapper.classList.add("is-minimized")
    localStorage.setItem("mathnuscripts-controls-minimized", "true")
  })

  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target
    if (target instanceof Node && !wrapper.contains(target)) close()
  }
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") close()
  }
  document.addEventListener("click", handleDocumentClick)
  document.addEventListener("keydown", handleEscape)

  wrapper.append(toggle, menu)
  document.body.append(wrapper)

  cleanupMenu = () => {
    document.removeEventListener("click", handleDocumentClick)
    document.removeEventListener("keydown", handleEscape)
    wrapper.remove()
    cleanupMenu = () => {}
  }
}

function initReaderNavigation(): void {
  cleanupCurrent()
  cleanupMenu()
  installToolbarFallback()
  initMathnuscriptsMenu()
  renderGardenOverview()

  const entries = getReaderIndex()
  const index = entries.findIndex((entry) => entry.slug === currentSlug())
  if (index < 0) return

  const previous = entries[index - 1]
  const next = entries[index + 1]

  const nav = document.createElement("nav")
  nav.className = "reader-nav"
  nav.setAttribute("aria-label", "Essay navigation")

  const previousButton = createButton(
    "reader-nav-button reader-nav-previous",
    "Previous essay",
    previous,
    () => navigateTo(previous),
  )
  const nextButton = createButton("reader-nav-button reader-nav-next", "Next essay", next, () =>
    navigateTo(next),
  )
  const progress = document.createElement("span")
  progress.className = "reader-nav-progress"
  progress.textContent = `${index + 1} / ${entries.length}`

  nav.append(previousButton, progress, nextButton)

  const previousEdge = createButton(
    "reader-edge reader-edge-previous",
    "Previous essay",
    previous,
    () => navigateTo(previous),
  )
  const nextEdge = createButton("reader-edge reader-edge-next", "Next essay", next, () =>
    navigateTo(next),
  )

  document.body.append(nav, previousEdge, nextEdge)

  const updateVisibility = () => {
    const active = isReaderMode()
    document.body.classList.toggle("reader-navigation-active", active)
    previousButton.disabled = !active || !previous
    nextButton.disabled = !active || !next
    previousEdge.disabled = !active || !previous
    nextEdge.disabled = !active || !next
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isReaderMode() || event.defaultPrevented) return
    const target = event.target as HTMLElement | null
    if (target?.matches("input, textarea, select, button, a, [contenteditable='true']")) return
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (event.key === "ArrowLeft" && previous) {
      event.preventDefault()
      navigateTo(previous)
    } else if (event.key === "ArrowRight" && next) {
      event.preventDefault()
      navigateTo(next)
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
  }

  window.addCleanup(() => cleanupCurrent())
}

document.addEventListener("nav", initReaderNavigation)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReaderNavigation, { once: true })
} else {
  initReaderNavigation()
}
