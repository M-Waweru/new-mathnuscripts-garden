import { extractApiError, formatAskClientError } from "../../util/askClient"

function initAskMathnuscripts(): void {
  const drawer = document.querySelector("#ask-mathnuscripts-drawer") as HTMLElement | null
  if (!drawer || drawer.dataset.ready === "true") return
  drawer.dataset.ready = "true"

  const input = drawer.querySelector("#ask-mathnuscripts-input") as HTMLTextAreaElement | null
  const selection = drawer.querySelector(".ask-mathnuscripts-selection") as HTMLElement | null
  const contextTitle = drawer.querySelector(".ask-mathnuscripts-context-title") as HTMLElement | null
  const status = drawer.querySelector(".ask-mathnuscripts-status") as HTMLElement | null
  const thread = drawer.querySelector(".ask-mathnuscripts-thread") as HTMLElement | null
  const suggestions = drawer.querySelector(".ask-mathnuscripts-suggestions") as HTMLElement | null
  const panel = drawer.querySelector(".ask-mathnuscripts-panel") as HTMLElement | null
  const form = drawer.querySelector("form.ask-mathnuscripts-form") as HTMLFormElement | null
  const submitButton = form?.querySelector("button") as HTMLButtonElement | null
  if (!input || !selection || !contextTitle || !status || !thread || !form || !submitButton) return

  const askApiUrl = `${document.body.dataset.basepath ?? ""}/api/ask`.replace(/\/+/g, "/")
  let activeContext = { title: "", selection: "" }
  let chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  let lastFocused: Element | null = null

  const focusableSelector =
    'button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled])'

  const trapFocus = (event: KeyboardEvent) => {
    if (drawer.dataset.open !== "true" || event.key !== "Tab" || !panel) return
    const focusables = [...panel.querySelectorAll<HTMLElement>(focusableSelector)]
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const setStatus = (message: string, tone?: string) => {
    if (!message) {
      status.hidden = true
      status.textContent = ""
      status.removeAttribute("data-tone")
      return
    }
    status.hidden = false
    status.textContent = message
    if (tone) status.dataset.tone = tone
    else status.removeAttribute("data-tone")
  }

  const scrollThread = () => {
    thread.scrollTop = thread.scrollHeight
  }

  const renderSources = (container: HTMLElement, sources: Array<Record<string, string>>) => {
    if (!sources || sources.length === 0) return
    const wrap = document.createElement("div")
    wrap.className = "ask-mathnuscripts-sources"
    const heading = document.createElement("h3")
    heading.textContent = "Sources"
    wrap.append(heading)
    for (const source of sources) {
      const card = document.createElement("article")
      card.className = "ask-mathnuscripts-source"
      const link = document.createElement("a")
      link.href = source.url || "#"
      link.textContent = source.title || "Untitled note"
      const meta = document.createElement("span")
      meta.textContent = source.heading || source.text?.slice(0, 120) || ""
      card.append(link, meta)
      wrap.append(card)
    }
    container.append(wrap)
  }

  const appendMessage = (
    role: "user" | "assistant",
    content: string,
    sources?: Array<Record<string, string>>,
  ) => {
    const bubble = document.createElement("article")
    bubble.className = `ask-mathnuscripts-message ask-mathnuscripts-message-${role}`
    bubble.dataset.role = role
    const label = document.createElement("span")
    label.className = "ask-mathnuscripts-message-label"
    label.textContent = role === "user" ? "You" : "Garden"
    const body = document.createElement("div")
    body.className = "ask-mathnuscripts-message-body"
    body.textContent = content
    bubble.append(label, body)
    if (role === "assistant") renderSources(bubble, sources ?? [])
    thread.append(bubble)
    scrollThread()
    if (suggestions) suggestions.hidden = thread.children.length > 0
  }

  const resetChat = () => {
    chatHistory = []
    thread.replaceChildren()
    setStatus("")
    if (suggestions) suggestions.hidden = false
  }

  const parseResponseBody = async (response: Response) => {
    const raw = await response.text()
    if (!raw) return {}
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      if (response.status === 404) {
        throw new Error(
          'Ask API not found. Run "npm run dev" (netlify dev) locally — quartz preview alone does not serve /api/ask.',
        )
      }
      throw new Error("Ask returned an unexpected response. Check that netlify dev is running.")
    }
  }

  const open = () => {
    lastFocused = document.activeElement
    const selected = window.getSelection?.()?.toString().trim() || ""
    const pageTitle = drawer.dataset.noteTitle || document.title
    activeContext = { title: pageTitle.trim(), selection: selected }
    contextTitle.textContent = pageTitle
    selection.hidden = !selected
    selection.textContent = selected
      ? `Selected: “${selected.slice(0, 240)}${selected.length > 240 ? "…”" : "”"}`
      : ""
    drawer.dataset.open = "true"
    drawer.setAttribute("aria-hidden", "false")
    input.focus()
  }

  const close = () => {
    drawer.dataset.open = "false"
    drawer.setAttribute("aria-hidden", "true")
    if (lastFocused instanceof HTMLElement) lastFocused.focus()
  }

  document.addEventListener("mathnuscripts:open-ask", open)
  drawer.querySelectorAll("[data-ask-close]").forEach((element) => {
    element.addEventListener("click", close)
  })
  drawer.querySelector("[data-ask-reset]")?.addEventListener("click", resetChat)
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.dataset.open === "true") close()
  })
  panel?.addEventListener("keydown", trapFocus)
  drawer.querySelectorAll("[data-ask-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = (button as HTMLButtonElement).dataset.askSuggestion || ""
      input.focus()
    })
  })

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    const question = input.value.trim()
    if (!question) {
      input.focus()
      return
    }

    appendMessage("user", question)
    chatHistory.push({ role: "user", content: question })
    input.value = ""
    setStatus("Searching the garden and drafting an answer…")
    submitButton.disabled = true

    try {
      const response = await fetch(askApiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          context: activeContext,
          history: chatHistory.slice(0, -1),
        }),
      })
      const data = await parseResponseBody(response)
      const errorMessage = extractApiError(data, response)

      if (!response.ok || data.status === "error") {
        chatHistory.pop()
        thread.lastElementChild?.remove()
        if (suggestions) suggestions.hidden = thread.children.length > 0
        setStatus(errorMessage || "Ask could not complete this request.", "error")
        return
      }

      if (typeof data.answer === "string" && data.answer) {
        appendMessage("assistant", data.answer, (data.sources as Array<Record<string, string>>) ?? [])
        chatHistory.push({ role: "assistant", content: data.answer })
        setStatus("")
      } else {
        chatHistory.pop()
        thread.lastElementChild?.remove()
        if (suggestions) suggestions.hidden = thread.children.length > 0
        setStatus(errorMessage || "No answer was returned. Try a different question.", "error")
      }
    } catch (error) {
      chatHistory.pop()
      thread.lastElementChild?.remove()
      if (suggestions) suggestions.hidden = thread.children.length > 0
      setStatus(formatAskClientError(error), "error")
    } finally {
      submitButton.disabled = false
      input.focus()
    }
  })
}

document.addEventListener("nav", initAskMathnuscripts)
