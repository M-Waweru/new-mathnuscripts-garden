---
publish: true
created: 2025-08-14T03:45:35.455+03:00
modified: 2025-08-14T03:52:51.366+03:00
---

# Garden Network (Mathnuscripts)

Concept for a network of personal digital gardens.

## Principles

- Own your notes, share your garden
- Interoperate via open protocols (ActivityPub)
- Curate themes and recommendations

## Concept Diagram

```mermaid
graph TD
  U1[Garden A] -- ActivityPub --> H[Hub]
  U2[Garden B] -- ActivityPub --> H
  U3[Garden C] -- ActivityPub --> H
  H --> F[Feeds/Discovery]
  H --> T[Theme Library]
```

## References

- [[Mathnuscripts Master Plan]]
- [[Publishing (Mathnuscripts)]]
