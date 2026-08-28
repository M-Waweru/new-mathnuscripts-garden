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
      <button
        class="ask-mathnuscripts-trigger"
        type="button"
        aria-controls="ask-mathnuscripts-drawer"
        aria-expanded="false"
        data-note-title={title}
      >
        <span aria-hidden="true">✦</span> Ask
      </button>
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
              <p class="ask-mathnuscripts-kicker">Mathnuscripts experiment</p>
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
              <span>Sources will be shown with the answer.</span>
              <button type="submit">Preview question</button>
            </div>
          </form>
        </section>
      </aside>
      <style>{`
        .ask-mathnuscripts-trigger{position:fixed;right:1.25rem;bottom:.75rem;z-index:121;border:1px solid var(--gray);border-radius:999px;background:var(--dark);color:var(--light);padding:.72rem 1rem;box-shadow:0 8px 24px rgba(0,0,0,.18);font:inherit;font-weight:650;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}.ask-mathnuscripts-trigger:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.25)}.ask-mathnuscripts-trigger span{color:var(--secondary);margin-right:.3rem}.ask-mathnuscripts-drawer{display:none;position:fixed;inset:0;z-index:30}.ask-mathnuscripts-drawer[data-open="true"]{display:block}.ask-mathnuscripts-backdrop{position:absolute;inset:0;background:rgba(4,8,18,.46)}.ask-mathnuscripts-panel{position:absolute;right:1rem;bottom:1rem;width:min(440px,calc(100vw - 2rem));max-height:calc(100vh - 2rem);overflow:auto;background:var(--light);color:var(--dark);border:1px solid var(--lightgray);border-radius:1.25rem;padding:1.2rem;box-shadow:0 24px 80px rgba(0,0,0,.28)}.ask-mathnuscripts-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.ask-mathnuscripts-kicker{margin:0 0 .25rem;color:var(--secondary);font-size:.72rem;font-weight:750;letter-spacing:.1em;text-transform:uppercase}.ask-mathnuscripts-header h2{margin:0;font-size:1.5rem}.ask-mathnuscripts-close{border:0;background:transparent;color:var(--gray);font-size:1.8rem;line-height:1;cursor:pointer}.ask-mathnuscripts-context{display:flex;flex-direction:column;gap:.15rem;margin:1rem 0;padding:.85rem 1rem;border-radius:.8rem;background:var(--highlight);font-size:.88rem}.ask-mathnuscripts-context-title{font-weight:650}.ask-mathnuscripts-selection{color:var(--gray);font-size:.82rem}.ask-mathnuscripts-suggestions{display:flex;flex-wrap:wrap;gap:.45rem;margin-bottom:1rem}.ask-mathnuscripts-suggestions button{border:1px solid var(--lightgray);border-radius:999px;background:transparent;color:var(--darkgray);padding:.45rem .7rem;font:inherit;font-size:.78rem;cursor:pointer}.ask-mathnuscripts-suggestions button:hover{border-color:var(--secondary)}.ask-mathnuscripts-form textarea{width:100%;resize:vertical;border:1px solid var(--lightgray);border-radius:.8rem;background:transparent;color:inherit;padding:.75rem;font:inherit}.ask-mathnuscripts-form-footer{display:flex;align-items:center;justify-content:space-between;gap:.7rem;margin-top:.65rem;color:var(--gray);font-size:.75rem}.ask-mathnuscripts-form-footer button{border:0;border-radius:999px;background:var(--secondary);color:var(--light);padding:.6rem .9rem;font:inherit;font-weight:650;cursor:pointer}.ask-mathnuscripts-status{margin:0 0 1rem;padding:.75rem .9rem;border-left:3px solid var(--secondary);background:var(--highlight);font-size:.88rem}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.ask-mathnuscripts-trigger{right:1rem;bottom:1rem}.ask-mathnuscripts-panel{right:0;bottom:3.75rem;width:calc(100% - 1.5rem);max-height:calc(90vh - 3.75rem);border-radius:1.25rem}.ask-mathnuscripts-form-footer{align-items:flex-end;flex-direction:column}.ask-mathnuscripts-form-footer button{width:100%}}
      `}</style>
      <script>{`(() => {
        const trigger = document.querySelector('.ask-mathnuscripts-trigger')
        const drawer = document.querySelector('#ask-mathnuscripts-drawer')
        if (!trigger || !drawer || drawer.dataset.ready === 'true') return
        drawer.dataset.ready = 'true'
        const input = drawer.querySelector('#ask-mathnuscripts-input')
        const selection = drawer.querySelector('.ask-mathnuscripts-selection')
        const contextTitle = drawer.querySelector('.ask-mathnuscripts-context-title')
        const status = drawer.querySelector('.ask-mathnuscripts-status')
        const open = () => {
          const selected = window.getSelection?.()?.toString().trim() || ''
          const pageTitle = trigger.dataset.noteTitle || document.title
          contextTitle.textContent = pageTitle
          selection.hidden = !selected
          selection.textContent = selected ? 'Selected: “' + selected.slice(0, 240) + (selected.length > 240 ? '…”' : '”') : ''
          drawer.dataset.open = 'true'
          drawer.setAttribute('aria-hidden', 'false')
          trigger.setAttribute('aria-expanded', 'true')
          input.focus()
        }
        const close = () => { drawer.dataset.open = 'false'; drawer.setAttribute('aria-hidden', 'true'); trigger.setAttribute('aria-expanded', 'false') }
        trigger.addEventListener('click', open)
        drawer.querySelectorAll('[data-ask-close]').forEach((element) => element.addEventListener('click', close))
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && drawer.dataset.open === 'true') close() })
        drawer.querySelectorAll('[data-ask-suggestion]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.askSuggestion || ''; input.focus() }))
        const form = drawer.querySelector('.ask-mathnuscripts-form')
        form.addEventListener('submit', async (event) => {
          event.preventDefault()
          const question = input.value.trim()
          if (!question) { input.focus(); return }
          status.hidden = false
          status.textContent = 'Searching the Mathnuscripts…'
          try {
            const response = await fetch('/api/ask', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ question }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'The Ask service is unavailable.')
            const sourceNames = (data.sources || []).map((source) => source.title).join(', ')
            status.textContent = sourceNames
              ? 'Retrieved sources: ' + sourceNames + '. Live ChatGPT generation is the next pilot slice.'
              : 'No matching Mathnuscripts sources were found. Try a different question.'
          } catch (error) {
            status.textContent = error instanceof Error ? error.message : 'The Ask service is unavailable.'
          }
        })
      })()`}</script>
    </>
  )
}

export default (() => AskMathnuscripts) satisfies QuartzComponentConstructor
