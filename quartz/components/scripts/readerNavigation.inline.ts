type ReaderEntry = {
  slug: string
  title: string
}

type ReaderIndex = ReaderEntry[]

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
  window.location.href = buildHref(entry.slug)
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

  const toolbar = document.querySelector(".sidebar.left > .flex-component")
  if (!toolbar) return

  const wrapper = document.createElement("div")
  wrapper.className = "mathnuscripts-menu-wrapper"

  const toggle = document.createElement("button")
  toggle.type = "button"
  toggle.className = "mathnuscripts-menu-toggle"
  toggle.setAttribute("aria-label", "Open Mathnuscripts menu")
  toggle.setAttribute("aria-expanded", "false")
  toggle.textContent = "☰"

  const menu = document.createElement("div")
  menu.className = "mathnuscripts-menu"
  menu.setAttribute("aria-label", "Mathnuscripts views")
  menu.hidden = true

  const close = () => {
    menu.hidden = true
    toggle.setAttribute("aria-expanded", "false")
  }

  const siteIndex = getSiteIndex()
  addMenuItem(menu, "Random note", "Open a surprise from the garden", () => {
    const candidates = siteIndex.filter((entry) => entry.slug !== currentSlug())
    navigateTo(candidates[Math.floor(Math.random() * candidates.length)] ?? siteIndex[0])
  })
  addMenuItem(menu, "Reader Mode", "Read essays like a book", () => {
    toggleReaderMode()
    close()
  })
  addMenuItem(menu, "Graph Explorer", "Jump to the connected notes", () => {
    const graph = document.querySelector(".graph")
    if (graph) graph.scrollIntoView({ behavior: "smooth", block: "center" })
    else window.location.href = buildHref("index")
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
    menu.hidden = !menu.hidden
    toggle.setAttribute("aria-expanded", String(!menu.hidden))
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
  toolbar.prepend(wrapper)

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
