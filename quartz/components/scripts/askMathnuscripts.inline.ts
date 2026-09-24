import { extractApiError, formatAskClientError } from "../../util/askClient"
import {
  clearPersistedAskChat,
  loadPersistedAskChat,
  type PersistedAskMessage,
  type PersistedAskSource,
  savePersistedAskChat,
} from "../../util/askChatStorage"

type ChatTurn = PersistedAskMessage

function renderAssistantBody(
  container: HTMLElement,
  content: string,
  sources: PersistedAskSource[],
): void {
  container.replaceChildren()
  const parts = content.split(/(\[\d+\])/g)
  for (const part of parts) {
    if (!part) continue
    const match = part.match(/^\[(\d+)\]$/)
    if (match) {
      const source = sources[Number(match[1]) - 1]
      if (source?.url) {
        const link = document.createElement("a")
        link.className = "ask-mathnuscripts-citation"
        link.href = source.url
        link.textContent = part
        link.title = source.title || `Source ${match[1]}`
        container.append(link)
        continue
      }
    }
    container.append(document.createTextNode(part))
  }
}

function initAskMathnuscripts(): void {
  const drawer = document.querySelector("#ask-mathnuscripts-drawer") as HTMLElement | null
  if (!drawer || drawer.dataset.ready === "true") return
  drawer.dataset.ready = "true"

  const input = drawer.querySelector("#ask-mathnuscripts-input") as HTMLTextAreaElement | null
  const selection = drawer.querySelector(".ask-mathnuscripts-selection") as HTMLElement | null
  const contextTitle = drawer.querySelector(
    ".ask-mathnuscripts-context-title",
  ) as HTMLElement | null
  const status = drawer.querySelector(".ask-mathnuscripts-status") as HTMLElement | null
  const thread = drawer.querySelector(".ask-mathnuscripts-thread") as HTMLElement | null
  const emptyState = drawer.querySelector(".ask-mathnuscripts-empty") as HTMLElement | null
  const panel = drawer.querySelector(".ask-mathnuscripts-panel") as HTMLElement | null
  const form = drawer.querySelector("form.ask-mathnuscripts-form") as HTMLFormElement | null
  const submitButton = form?.querySelector(".ask-mathnuscripts-send") as HTMLButtonElement | null
  if (!input || !selection || !contextTitle || !status || !thread || !form || !submitButton) return

  const askApiUrl = `${document.body.dataset.basepath ?? ""}/api/ask`.replace(/\/+/g, "/")
  let activeContext = { title: "", selection: "" }
  let chatHistory: ChatTurn[] = []
  let lastFocused: Element | null = null

  const focusableSelector =
    "button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled])"

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
      panel?.classList.remove("ask-mathnuscripts-panel-busy")
      return
    }
    status.hidden = false
    status.textContent = message
    if (tone) status.dataset.tone = tone
    else status.removeAttribute("data-tone")
    panel?.classList.toggle("ask-mathnuscripts-panel-busy", tone !== "error")
  }

  const scrollThread = () => {
    thread.scrollTop = thread.scrollHeight
  }

  const syncEmptyState = () => {
    const hasMessages = thread.querySelector(".ask-mathnuscripts-message") !== null
    if (emptyState) emptyState.hidden = hasMessages
  }

  const renderSources = (container: HTMLElement, sources: PersistedAskSource[]) => {
    if (!sources || sources.length === 0) return
    const wrap = document.createElement("div")
    wrap.className = "ask-mathnuscripts-sources"
    const heading = document.createElement("p")
    heading.className = "ask-mathnuscripts-sources-label"
    heading.textContent = "Cited notes"
    wrap.append(heading)
    for (const source of sources) {
      const card = document.createElement("a")
      card.className = "ask-mathnuscripts-source"
      card.href = source.url || "#"
      const title = document.createElement("span")
      title.className = "ask-mathnuscripts-source-title"
      title.textContent = source.title || "Untitled note"
      const meta = document.createElement("span")
      meta.className = "ask-mathnuscripts-source-meta"
      meta.textContent = source.heading || source.text?.slice(0, 100) || ""
      card.append(title, meta)
      wrap.append(card)
    }
    container.append(wrap)
  }

  const appendMessage = (turn: ChatTurn) => {
    const bubble = document.createElement("article")
    bubble.className = `ask-mathnuscripts-message ask-mathnuscripts-message-${turn.role}`
    bubble.dataset.role = turn.role
    const body = document.createElement("div")
    body.className = "ask-mathnuscripts-message-body"
    if (turn.role === "assistant") {
      renderAssistantBody(body, turn.content, turn.sources ?? [])
      renderSources(bubble, turn.sources ?? [])
    } else {
      body.textContent = turn.content
    }
    bubble.append(body)
    thread.append(bubble)
    syncEmptyState()
    scrollThread()
  }

  const persistChat = () => {
    savePersistedAskChat(chatHistory)
  }

  const restoreChat = () => {
    const saved = loadPersistedAskChat()
    chatHistory = saved?.messages ?? []
    thread.querySelectorAll(".ask-mathnuscripts-message").forEach((node) => node.remove())
    for (const turn of chatHistory) {
      appendMessage(turn)
    }
    syncEmptyState()
  }

  const resetChat = () => {
    chatHistory = []
    thread.querySelectorAll(".ask-mathnuscripts-message").forEach((node) => node.remove())
    clearPersistedAskChat()
    setStatus("")
    syncEmptyState()
    input.focus()
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
    setStatus("")
    if (lastFocused instanceof HTMLElement) lastFocused.focus()
  }

  restoreChat()

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

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      form.requestSubmit()
    }
  })

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    const question = input.value.trim()
    if (!question) {
      input.focus()
      return
    }

    const userTurn: ChatTurn = { role: "user", content: question }
    appendMessage(userTurn)
    chatHistory.push(userTurn)
    persistChat()
    input.value = ""
    setStatus("Searching the garden…")
    submitButton.disabled = true

    try {
      const response = await fetch(askApiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          context: activeContext,
          history: chatHistory.slice(0, -1).map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = await parseResponseBody(response)
      const errorMessage = extractApiError(data, response)

      if (!response.ok || data.status === "error") {
        chatHistory.pop()
        thread.lastElementChild?.remove()
        syncEmptyState()
        persistChat()
        setStatus(errorMessage || "Ask could not complete this request.", "error")
        return
      }

      if (typeof data.answer === "string" && data.answer) {
        const sources = (data.sources as PersistedAskSource[]) ?? []
        const assistantTurn: ChatTurn = { role: "assistant", content: data.answer, sources }
        appendMessage(assistantTurn)
        chatHistory.push(assistantTurn)
        persistChat()
        setStatus("")
      } else {
        chatHistory.pop()
        thread.lastElementChild?.remove()
        syncEmptyState()
        persistChat()
        setStatus(errorMessage || "No answer was returned. Try a different question.", "error")
      }
    } catch (error) {
      chatHistory.pop()
      thread.lastElementChild?.remove()
      syncEmptyState()
      persistChat()
      setStatus(formatAskClientError(error), "error")
    } finally {
      submitButton.disabled = false
      input.focus()
    }
  })
}

document.addEventListener("nav", initAskMathnuscripts)
