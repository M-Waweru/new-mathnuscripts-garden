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
        <div
          class="ask-mathnuscripts-thread"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        />
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
  )
}

export default (() => AskMathnuscripts) satisfies QuartzComponentConstructor
