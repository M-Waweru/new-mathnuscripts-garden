# Mathnuscripts Site Audit

Audit date: 2026-09-18  
Repository: `new-mathnuscripts-garden` (Quartz v5 digital garden, Netlify deploy)

## Summary

Mathnuscripts is a well-customized Quartz fork with strong UX experiments (reader mode, garden stats, Ask Mathnuscripts). The main risks were **broken currency rendering from KaTeX**, **a reader-mode navigation bug**, **homepage SEO conflicts**, and **missing CI on this fork**. This PR fixes the highest-impact issues and documents the remaining backlog.

---

## Critical

| What                                                                     | Why it matters                                                         | Where                                                                                                                                          |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| KaTeX treats `$150K` as inline math                                      | Corrupts prose across essays with dollar amounts; visible garbled text | Obsidian math parsing in `@quartz-community/obsidian-flavored-markdown`; affected pages e.g. `content/Content/Essays/The Chronicles of IAN.md` |
| **Fixed:** Added `preserve-dollar-text` plugin + disabled LaTeX renderer | Escapes currency `$` before parsing; no KaTeX false positives          | `plugins/preserve-dollar-text/`, `quartz.config.yaml`                                                                                          |

---

## High

| What                                                         | Why it matters                                                                 | Where                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Reader index used full site list                             | Reader mode prev/next navigated all 200+ pages, not essays in order            | `quartz/components/Head.tsx`                                    |
| **Fixed:** Use `buildEssayReaderIndex()`                     | Restores intended essay reading flow                                           | `quartz/components/Head.tsx`                                    |
| Netlify redirected `/` → `/content/home`                     | Bypassed polished landing at `content/index.md`; split SEO signals             | `netlify.toml`                                                  |
| **Fixed:** Removed redirect                                  | `/` now serves `index.html` (landing page)                                     | `netlify.toml`                                                  |
| Broken wikilinks on homepage                                 | First-visit dead ends (`Journalling`, `Kenya is Beautiful`)                    | `content/index.md`                                              |
| **Fixed:** Replaced with existing notes                      | Links now resolve                                                              | `content/index.md`                                              |
| Invalid / incomplete SEO meta                                | Wrong `og:site_name` attribute, no canonical, 404 indexed, weak `og:image:alt` | `quartz/components/Head.tsx`                                    |
| **Fixed:** OG, canonical, noindex on 404, root URL for index | Better sharing and crawl hygiene                                               | `quartz/components/Head.tsx`                                    |
| CI does not run on this fork                                 | Upstream workflows gated to `jackyzha0/quartz`                                 | `.github/workflows/ci.yaml`                                     |
| **Fixed:** Added Mathnuscripts CI workflow                   | PR/push runs check, test, build                                                | `.github/workflows/mathnuscripts-ci.yaml`                       |
| ~53 broken internal wikilinks sitewide                       | Obsidian notes never migrated; hurts trust and graph                           | Across `content/` (e.g. `cerebrations`, `shukran`, `computing`) |
| **Not fixed in this PR**                                     | Content migration scope; needs Obsidian sync or manual stubs                   | `content/`                                                      |

---

## Medium

| What                                                      | Why it matters                                           | Where                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Ask context shown but not sent to API                     | UI promised page context; backend ignored it             | `quartz/components/AskMathnuscripts.tsx`, `netlify/functions/ask.mjs` |
| **Fixed:** POST includes `context`                        | Ready for context-aware retrieval                        | `AskMathnuscripts.tsx`, `ask.mjs`                                     |
| Ask menu item disabled while button live                  | Confusing UX                                             | `quartz/components/scripts/readerNavigation.inline.ts`                |
| **Fixed:** Menu opens Ask drawer                          | Consistent navigation                                    | `readerNavigation.inline.ts`                                          |
| Ask drawer z-index / focus trap                           | Modal sat below trigger; Tab could escape                | `AskMathnuscripts.tsx`                                                |
| **Fixed:** z-index 130, focus trap, return focus on close | Accessibility improvement                                | `AskMathnuscripts.tsx`                                                |
| No skip-to-content link                                   | Keyboard users must tab through chrome                   | Sitewide layout                                                       |
| **Fixed:** Skip link in default frame                     | WCAG navigation aid                                      | `DefaultFrame.tsx`, `base.scss`                                       |
| Outdated hosting copy on legacy home                      | Still mentions Obsidian Digital Garden plugin            | `content/Content/Home.md`                                             |
| **Fixed:** Updated to Quartz/Netlify                      | Accurate visitor info                                    | `content/Content/Home.md`                                             |
| Ask API has no rate limiting                              | Stated intent vs. open POST endpoint                     | `netlify/functions/ask.mjs`, `content/Ask Mathnuscripts.md`           |
| **Not fixed**                                             | Needs Netlify edge middleware or external store          | `netlify/functions/ask.mjs`                                           |
| Large unoptimized images (~19 MB in `content/Media/`)     | Slow LCP on image-heavy notes                            | `content/Media/`, `quartz/static/mathnuscripts-logo.png` (1.5 MB)     |
| **Not fixed**                                             | Requires image pipeline or manual compression            | —                                                                     |
| Duplicate JSON inlined on every HTML page                 | ~20 KB duplicated per page (essay + site indexes)        | `Head.tsx` (partially improved by distinct indexes)                   |
| `allowDangerousHtml: true` in markdown                    | Trusted-author site; raw HTML in markdown passes through | `quartz/processors/parse.ts`                                          |
| Prettier check fails on 24 files                          | Obsidian publish workflow runs `npm run check`           | Mostly `content/` markdown                                            |
| Missing CSP header                                        | Defense in depth for XSS                                 | `netlify.toml`                                                        |
| **Partially fixed:** HSTS + Permissions-Policy added      | CSP still deferred (needs nonce/hash audit)              | `netlify.toml`                                                        |
| Graph Explorer empty without JS                           | Stats/latest lists are JS-only shells                    | `content/graph-explorer.md`                                           |
| README is upstream Quartz, not Mathnuscripts              | Onboarding friction                                      | `README.md`                                                           |

---

## Low

| What                                   | Why it matters                      | Where                       |
| -------------------------------------- | ----------------------------------- | --------------------------- |
| MathJax CSS unused                     | Dead CSS after KaTeX disable        | `quartz/styles/base.scss`   |
| 15 MB `emojimap.json` unused           | Repo bloat                          | `quartz/util/emojimap.json` |
| Stale domain links in essays           | `mathnuscripts.com`, old hosts      | Various `content/` files    |
| Graph inaccessible to screen readers   | Canvas/SVG with no text alternative | Graph plugin output         |
| No `prefers-reduced-motion`            | Animations always on                | `custom.scss`, `base.scss`  |
| No ESLint                              | Static analysis gap                 | —                           |
| npm audit: sharp, brace-expansion      | Dependency CVEs                     | `package-lock.json`         |
| Encrypted pages plugin enabled, unused | Extra crypto surface                | `quartz.config.yaml`        |

---

## Implemented in this PR

1. Added `preserve-dollar-text` plugin and disabled LaTeX renderer (fixes currency corruption)
2. Fixed essay reader index in `Head.tsx`
3. SEO: canonical URLs, correct OG tags, 404 `noindex`, root URL for homepage
4. Removed Netlify `/` → `/content/home` redirect
5. Fixed homepage broken wikilinks
6. Ask Mathnuscripts: context in API, menu wiring, focus trap, z-index, button label
7. Skip-to-content link
8. Updated legacy `Content/Home.md` hosting copy
9. Added HSTS and Permissions-Policy headers
10. Added `.github/workflows/mathnuscripts-ci.yaml`

---

## Recommended follow-ups

1. **Content link hygiene** — audit and fix ~53 broken wikilinks; add stub pages or aliases for high-traffic targets (`cerebrations`, `shukran`, `computing`).
2. **Image optimization** — compress `content/Media/` assets and logo; add `loading="lazy"` for below-fold images.
3. **Ask rate limiting** — Netlify edge or Upstash before LLM integration.
4. **CSP** — add after auditing inline scripts (Ask drawer, reader nav, 404 redirect).
5. **Mathnuscripts README** — replace upstream Quartz README with project-specific setup/deploy docs.
6. **Graph Explorer static fallback** — noscript or build-time stats for garden overview.
7. **Custom domain** — if `mathnuscripts.com` is intended, update `baseUrl` and regenerate sitemap/OG URLs.
