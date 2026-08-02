---
publish: true
created: 2025-08-14T03:45:25.006+03:00
modified: 2025-08-14T03:52:58.007+03:00
---

# Handwritten to Digital (Mathnuscripts)

Approaches and workflow for converting notebooks to searchable notes.

## Methods

- Scan to PDF → OCR → Import
- Voice read-through → STT transcript → Summarise
- Smart pens / digital notebooks
- Telegram → LLM transcription → Obsidian note

## Workflow

```mermaid
sequenceDiagram
  participant N as Notebook
  participant S as Scanner/Camera
  participant O as OCR/LLM
  participant V as Obsidian
  N->>S: Capture pages
  S->>O: Images/PDF
  O-->>V: Clean text + frontmatter
  V->>V: Link to related notes
```

## References

- [[Turning Handwritten Notes to Digital Notes]]
- [[Problems to Solve]]
- [[Building My Knowledge Base]]
