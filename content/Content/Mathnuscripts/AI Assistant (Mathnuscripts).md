---
publish: true
created: 2025-08-14T03:45:31.402+03:00
modified: 2025-08-14T03:52:37.033+03:00
---

# AI Assistant (Mathnuscripts)

Design for “Ask Mathenge” and RAG over the vault.

## Capabilities

- Natural-language Q\&A over vault + essays
- Suggest related notes and reading paths
- Draft essays from clustered topics

## High-level Design

```mermaid
flowchart LR
  U[User] --> Q[Chat UI]
  Q --> R[Router]
  R -->|Retrieve| E[Embedding Index]
  E --> D[Note Chunks]
  R -->|Generate| L[LLM]
  D --> L
  L --> A[Answer + Links]
```

## Sources

- [[Mathnuscripts]]
- [[Home]]
- [[Digital Mind]]
- [[Publishing (Mathnuscripts)]]
