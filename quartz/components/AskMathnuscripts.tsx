import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export type AskContext = {
  title: string
  selection: string
}

export function buildAskContext(title: string, selection: string): AskContext {
  return { title: title.trim(), selection: selection.trim() }
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
            <button
              class="ask-mathnuscripts-close"
              type="button"
              aria-label="Close Ask Mathnuscripts"
              data-ask-close="true"
            >
              ×
            </button>
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
          <div class="ask-mathnuscripts-status" role="status" hidden />
          <div class="ask-mathnuscripts-answer" hidden />
          <div class="ask-mathnuscripts-sources" hidden />
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
              <button type="submit">Ask garden</button>
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
        const answer = drawer.querySelector('.ask-mathnuscripts-answer')
        const sourcesWrap = drawer.querySelector('.ask-mathnuscripts-sources')
        const panel = drawer.querySelector('.ask-mathnuscripts-panel')
        const submitButton = drawer.querySelector('.ask-mathnuscripts-form button[type="submit"]')
        let activeContext = { title: '', selection: '' }
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

        const clearResults = () => {
          status.hidden = true
          status.textContent = ''
          status.removeAttribute('data-tone')
          answer.hidden = true
          answer.textContent = ''
          sourcesWrap.hidden = true
          sourcesWrap.replaceChildren()
        }

        const renderSources = (sources) => {
          sourcesWrap.replaceChildren()
          if (!sources || sources.length === 0) {
            sourcesWrap.hidden = true
            return
          }
          const heading = document.createElement('h3')
          heading.textContent = 'Sources'
          sourcesWrap.append(heading)
          for (const source of sources) {
            const card = document.createElement('article')
            card.className = 'ask-mathnuscripts-source'
            const link = document.createElement('a')
            link.href = source.url || '#'
            link.textContent = source.title || 'Untitled note'
            const meta = document.createElement('span')
            meta.textContent = source.heading || source.text?.slice(0, 120) || ''
            card.append(link, meta)
            sourcesWrap.append(card)
          }
          sourcesWrap.hidden = false
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
          clearResults()
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

          clearResults()
          status.hidden = false
          status.textContent = 'Searching the garden and drafting an answer…'
          submitButton.disabled = true

          try {
            const response = await fetch('/api/ask', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ question, context: activeContext }),
            })
            const data = await response.json()
            const errorMessage = data.error || data.message

            if (!response.ok || data.status === 'error') {
              status.dataset.tone = 'error'
              status.textContent = errorMessage || 'Ask could not complete this request.'
              renderSources(data.sources || [])
              return
            }

            if (data.answer) {
              status.hidden = true
              answer.hidden = false
              answer.textContent = data.answer
            } else {
              status.textContent = errorMessage || 'No answer was returned. Try a different question.'
            }

            renderSources(data.sources || [])
          } catch (error) {
            status.dataset.tone = 'error'
            status.textContent = error instanceof Error ? error.message : 'Ask is unavailable right now.'
          } finally {
            submitButton.disabled = false
          }
        })
      })()`}</script>
    </>
  )
}

export default (() => AskMathnuscripts) satisfies QuartzComponentConstructor
