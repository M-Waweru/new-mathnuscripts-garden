# Obsidian-to-Mathnuscripts Publishing

Obsidian is the source of truth for authored Mathnuscripts content. Quartz is the renderer and site repository. The publishing bridge is GitHub Actions; the Obsidian Digital Garden plugin is not required.

## Flow

```text
Obsidian repository push
  -> notify-mathnuscripts.yml
  -> new-mathnuscripts-garden publish-obsidian-content.yml
  -> allowlisted import
  -> validation and Quartz build
  -> commit to the site branch
  -> Netlify deploy
```

The importer currently publishes only:

- `Content/Essays/**`
- `Content/Mathnuscripts/**`, except `Content/Mathnuscripts/Index.md`

Only files with `dg-publish: true` are imported. The target metadata is converted to `publish: true` for Quartz. The site-managed Garden Overview (`content/index.md`) and application pages are never imported.

## Required one-time GitHub configuration

The Obsidian repository is private, so the workflows need repository credentials. Create a fine-grained token with the minimum required access:

1. Read access to `M-Waweru/obsidian-knowledge-base`.
2. Actions/workflow dispatch access to `M-Waweru/new-mathnuscripts-garden`.
3. Contents write access to the site repository only if the publisher commits imported files there.

Add the token as:

- `OBSIDIAN_REPO_TOKEN` in `new-mathnuscripts-garden` (read the Obsidian repository).
- `MATHNUSCRIPTS_REPO_TOKEN` in `obsidian-knowledge-base` (dispatch the site workflow).

The token values are never stored in the repositories. The workflows fail safely when the secrets are missing.

## Manual test

From the site repository, run the importer against a local checkout without changing files:

```bash
node scripts/import-obsidian-content.mjs \
  --source /path/to/obsidian-knowledge-base \
  --dry-run
```

The importer refuses to overwrite paths listed as site-managed in `scripts/obsidian-publish-manifest.json`.

## Editorial rule

Hermes should edit essays in the Obsidian repository after conversational approval. It should not edit imported files in the site repository. Imported files are deployment artifacts; site-owned files remain in the Quartz repository.
