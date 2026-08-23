type ReaderEntry = {
  slug: string
  title: string
}

type ReaderIndex = ReaderEntry[]

let cleanupCurrent = () => {}

function currentSlug(): string {
  return (document.body.dataset.slug ?? "").replace(/^\/+|\/+$/g, "")
}

function getReaderIndex(): ReaderIndex {
  const element = document.getElementById("essay-reader-index")
  if (!element?.textContent) return []

  try {
    const parsed = JSON.parse(element.textContent)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function buildHref(slug: string): string {
  const basePath = document.body.dataset.basepath ?? ""
  return `${basePath}/${slug}`.replace(/\/+/g, "/")
}

function isReaderMode(): boolean {
  return document.documentElement.getAttribute("reader-mode") === "on"
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

function initReaderNavigation(): void {
  cleanupCurrent()

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
