---
publish: true
created: 2025-08-14T03:45:17.640+03:00
modified: 2025-08-14T03:53:39.315+03:00
---

# Publishing (Mathnuscripts)

Centralised view of publishing across Markbase and a custom site.

## Current

- Markbase: `https://mathnuscripts.markbase.xyz/Home`
- Obsidian Digital Garden plugin for hosting

## Target Architecture

```mermaid
flowchart TB
  subgraph Authoring
    O[Obsidian Vault]
    J[Handwritten → OCR]
  end
  subgraph Build & Index
    P[Parser + Frontmatter]
    I[Search Index + Embeddings]
  end
  subgraph Delivery
    M[Markbase]
    C[Custom Site]
    A[Ask Mathenge]
  end
  O --> P --> I --> C
  O --> M
  I --> A
  J --> O
```

## Links

- [[Publishing My Second Brain]]
- [[Mathnuscripts]]
- [[Home]]
