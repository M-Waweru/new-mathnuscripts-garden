import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export type AskContext = {
  title: string
  selection: string
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
    <aside
      id="ask-mathnuscripts-drawer"
      class="ask-mathnuscripts-drawer"
      aria-hidden="true"
      aria-labelledby="ask-mathnuscripts-title"
      data-note-title={title}
    >
      <div class="ask-mathnuscripts-backdrop" data-ask-close="true" />
      <section class="ask-mathnuscripts-panel" role="dialog" aria-modal="true">
        <header class="ask-mathnuscripts-header">
          <div class="ask-mathnuscripts-heading">
            <h2 id="ask-mathnuscripts-title">Ask Mathnuscripts</h2>
            <p class="ask-mathnuscripts-tagline">Answers grounded in your notes, with citations.</p>
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
          <span class="ask-mathnuscripts-context-label">Reading</span>
          <span class="ask-mathnuscripts-context-title">{title}</span>
          <span class="ask-mathnuscripts-selection" hidden />
        </div>
        <div
          class="ask-mathnuscripts-thread"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          <div class="ask-mathnuscripts-empty">
            <p class="ask-mathnuscripts-empty-lead">What would you like to explore?</p>
            <p class="ask-mathnuscripts-empty-copy">
              Ask about this page or anything across the garden. Replies cite retrieved notes.
            </p>
            <div class="ask-mathnuscripts-suggestions">
              <button type="button" data-ask-suggestion="Explain the main idea of this note">
                Explain this note
              </button>
              <button type="button" data-ask-suggestion="Which related notes should I read next?">
                Related notes
              </button>
              <button type="button" data-ask-suggestion="Challenge the central claim in this note">
                Challenge this idea
              </button>
            </div>
          </div>
        </div>
        <div class="ask-mathnuscripts-status" role="status" hidden />
        <form class="ask-mathnuscripts-form">
          <label class="sr-only" for="ask-mathnuscripts-input">
            Ask a question about Mathnuscripts
          </label>
          <div class="ask-mathnuscripts-compose">
            <textarea
              id="ask-mathnuscripts-input"
              rows={2}
              placeholder="Ask anything…"
              autocomplete="off"
            />
            <button type="submit" class="ask-mathnuscripts-send" aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3.4 20.4 21 12 3.4 3.6l1.8 7.2L16 12l-10.8 1.2 1.8 7.2z"
                />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </aside>
  )
}

export default (() => AskMathnuscripts) satisfies QuartzComponentConstructor
