import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export type AskContext = {
  title: string
  selection: string
}

export type AskHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

export function buildAskContext(title: string, selection: string): AskContext {
  return { title: title.trim(), selection: selection.trim() }
}

export function buildAskApiUrl(basePath = ""): string {
  return `${basePath}/api/ask`.replace(/\/+/g, "/")
}

const AskMathnuscripts: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title ?? cfg.pageTitle ?? "Mathnuscripts"

  return (
    <>
      <aside
        id="ask-mathnuscripts-drawer"
        class="ask-mathnuscripts-drawer"
        aria-hidden="true"
        aria-labelledby="ask-mathnuscripts-title"
      >
        <div class="ask-mathnuscripts-backdrop" data-ask-close="true" />
        <section class="ask-mathnuscripts-panel" role="dialog" aria-modal="true">
          <header class="ask-mathnuscripts-header">
            <div>
              <p class="ask-mathnuscripts-kicker">Grounded in the garden</p>
              <h2 id="ask-mathnuscripts-title">Ask Mathnuscripts</h2>
            </div>
            <div class="ask-mathnuscripts-header-actions">
              <button
                class="ask-mathnuscripts-reset"
                type="button"
                aria-label="Start a new chat"
                data-ask-reset="true"
              >
                New chat
              </button>
              <button
                class="ask-mathnuscripts-close"
                type="button"
                aria-label="Close Ask Mathnuscripts"
                data-ask-close="true"
              >
                ×
              </button>
            </div>
          </header>
          <div class="ask-mathnuscripts-context" aria-live="polite">
            <strong>Context attached</strong>
            <span class="ask-mathnuscripts-context-title">{title}</span>
            <span class="ask-mathnuscripts-selection" hidden />
          </div>
          <div class="ask-mathnuscripts-suggestions">
            <button type="button" data-ask-suggestion="Explain the main idea of this note">
              Explain this note
            </button>
            <button type="button" data-ask-suggestion="Which related notes should I read next?">
              Find related notes
            </button>
            <button type="button" data-ask-suggestion="Challenge the central claim in this note">
              Challenge this idea
            </button>
          </div>
          <div class="ask-mathnuscripts-thread" role="log" aria-live="polite" aria-relevant="additions" />
          <div class="ask-mathnuscripts-status" role="status" hidden />
          <form class="ask-mathnuscripts-form">
            <label class="sr-only" for="ask-mathnuscripts-input">
              Ask a question about Mathnuscripts
            </label>
            <textarea
              id="ask-mathnuscripts-input"
              rows={3}
              placeholder="Ask about this note or the wider garden…"
            />
            <div class="ask-mathnuscripts-form-footer">
              <span>Answers cite retrieved garden sources.</span>
              <button type="submit">Send</button>
            </div>
          </form>
        </section>
      </aside>
      <script>{`(() => {
        const drawer = document.querySelector('#ask-mathnuscripts-drawer')
        if (!drawer || drawer.dataset.ready === 'true') return
        drawer.dataset.ready = 'true'

        const input = drawer.querySelector('#ask-mathnuscripts-input')
        const selection = drawer.querySelector('.ask-mathnuscripts-selection')
        const contextTitle = drawer.querySelector('.ask-mathnuscripts-context-title')
        const status = drawer.querySelector('.ask-mathnuscripts-status')
        const thread = drawer.querySelector('.ask-mathnuscripts-thread')
        const suggestions = drawer.querySelector('.ask-mathnuscripts-suggestions')
        const panel = drawer.querySelector('.ask-mathnuscripts-panel')
        const submitButton = drawer.querySelector('.ask-mathnuscripts-form button[type="submit"]')
        const askApiUrl = ((document.body.dataset.basepath || '') + '/api/ask').replace(/\\/+/g, '/')
        let activeContext = { title: '', selection: '' }
        let chatHistory = []
        let lastFocused = null

        const focusableSelector = 'button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled])'

        const trapFocus = (event) => {
          if (drawer.dataset.open !== 'true' || event.key !== 'Tab' || !panel) return
          const focusables = [...panel.querySelectorAll(focusableSelector)]
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

        const setStatus = (message, tone) => {
          if (!message) {
            status.hidden = true
            status.textContent = ''
            status.removeAttribute('data-tone')
            return
          }
          status.hidden = false
          status.textContent = message
          if (tone) status.dataset.tone = tone
          else status.removeAttribute('data-tone')
        }

        const scrollThread = () => {
          thread.scrollTop = thread.scrollHeight
        }

        const renderSources = (container, sources) => {
          if (!sources || sources.length === 0) return
          const wrap = document.createElement('div')
          wrap.className = 'ask-mathnuscripts-sources'
          const heading = document.createElement('h3')
          heading.textContent = 'Sources'
          wrap.append(heading)
          for (const source of sources) {
            const card = document.createElement('article')
            card.className = 'ask-mathnuscripts-source'
            const link = document.createElement('a')
            link.href = source.url || '#'
            link.textContent = source.title || 'Untitled note'
            const meta = document.createElement('span')
            meta.textContent = source.heading || source.text?.slice(0, 120) || ''
            card.append(link, meta)
            wrap.append(card)
          }
          container.append(wrap)
        }

        const appendMessage = (role, content, sources) => {
          const bubble = document.createElement('article')
          bubble.className = 'ask-mathnuscripts-message ask-mathnuscripts-message-' + role
          bubble.dataset.role = role
          const label = document.createElement('span')
          label.className = 'ask-mathnuscripts-message-label'
          label.textContent = role === 'user' ? 'You' : 'Garden'
          const body = document.createElement('div')
          body.className = 'ask-mathnuscripts-message-body'
          body.textContent = content
          bubble.append(label, body)
          if (role === 'assistant') renderSources(bubble, sources)
          thread.append(bubble)
          scrollThread()
          if (suggestions) suggestions.hidden = thread.children.length > 0
        }

        const resetChat = () => {
          chatHistory = []
          thread.replaceChildren()
          setStatus('')
          if (suggestions) suggestions.hidden = false
        }

        const parseResponseBody = async (response) => {
          const raw = await response.text()
          if (!raw) return {}
          try {
            return JSON.parse(raw)
          } catch {
            if (response.status === 404) {
              throw new Error(
                'Ask API not found. Run "npm run dev" (netlify dev) locally — quartz preview alone does not serve /api/ask.',
              )
            }
            throw new Error('Ask returned an unexpected response. Check that netlify dev is running.')
          }
        }

        const open = () => {
          lastFocused = document.activeElement
          const selected = window.getSelection?.()?.toString().trim() || ''
          const pageTitle = drawer.dataset.noteTitle || document.title
          activeContext = { title: pageTitle.trim(), selection: selected }
          contextTitle.textContent = pageTitle
          selection.hidden = !selected
          selection.textContent = selected
            ? 'Selected: “' + selected.slice(0, 240) + (selected.length > 240 ? '…”' : '”')
            : ''
          drawer.dataset.open = 'true'
          drawer.setAttribute('aria-hidden', 'false')
          input.focus()
        }

        const close = () => {
          drawer.dataset.open = 'false'
          drawer.setAttribute('aria-hidden', 'true')
          if (lastFocused instanceof HTMLElement) lastFocused.focus()
        }

        drawer.dataset.noteTitle = ${JSON.stringify(title)}

        document.addEventListener('mathnuscripts:open-ask', open)
        drawer.querySelectorAll('[data-ask-close]').forEach((element) => element.addEventListener('click', close))
        drawer.querySelector('[data-ask-reset]')?.addEventListener('click', resetChat)
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && drawer.dataset.open === 'true') close()
        })
        panel?.addEventListener('keydown', trapFocus)
        drawer.querySelectorAll('[data-ask-suggestion]').forEach((button) =>
          button.addEventListener('click', () => {
            input.value = button.dataset.askSuggestion || ''
            input.focus()
          }),
        )

        const form = drawer.querySelector('.ask-mathnuscripts-form')
        form.addEventListener('submit', async (event) => {
          event.preventDefault()
          const question = input.value.trim()
          if (!question) {
            input.focus()
            return
          }

          appendMessage('user', question)
          chatHistory.push({ role: 'user', content: question })
          input.value = ''
          setStatus('Searching the garden and drafting an answer…')
          submitButton.disabled = true

          try {
            const response = await fetch(askApiUrl, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ question, context: activeContext, history: chatHistory.slice(0, -1) }),
            })
            const data = await parseResponseBody(response)
            const errorMessage = data.error || data.message

            if (!response.ok || data.status === 'error') {
              chatHistory.pop()
              thread.lastElementChild?.remove()
              if (suggestions) suggestions.hidden = thread.children.length > 0
              setStatus(errorMessage || 'Ask could not complete this request.', 'error')
              return
            }

            if (data.answer) {
              appendMessage('assistant', data.answer, data.sources || [])
              chatHistory.push({ role: 'assistant', content: data.answer })
              setStatus('')
            } else {
              chatHistory.pop()
              thread.lastElementChild?.remove()
              if (suggestions) suggestions.hidden = thread.children.length > 0
              setStatus(errorMessage || 'No answer was returned. Try a different question.', 'error')
            }
          } catch (error) {
            chatHistory.pop()
            thread.lastElementChild?.remove()
            if (suggestions) suggestions.hidden = thread.children.length > 0
            setStatus(error instanceof Error ? error.message : 'Ask is unavailable right now.', 'error')
          } finally {
            submitButton.disabled = false
            input.focus()
          }
        })
      })()`}</script>
    </>
  )
}

export default (() => AskMathnuscripts) satisfies QuartzComponentConstructor
