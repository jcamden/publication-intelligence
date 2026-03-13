# Development Backlog

This directory tracks implementation epics and loose engineering todos that do not yet need a dedicated spec.

## Epics

- [03-index-editor](./03-index-editor/README.md)
- [04-export-publishing](./04-export-publishing/README.md)
- [05-infrastructure](./05-infrastructure/README.md)
- [06-matcher-detection](./06-matcher-detection/README.md)

## Random Todos

### Detection

- Ignore excluded regions during detection runs for both matcher-based and LLM-based pipelines.
- Determine exclusion by fuzzy bounding-box comparison using the existing bbox utilities.

### Index Page

- Use canonical page numbers instead of document page numbers on the Index page.
- If a canonical page number does not yet exist, fall back to the document page number.
- When falling back, show both the page number and an exclamation mark in red so the mismatch is obvious.
- Nice-to-have: clicking the red page number should navigate to the Editor with that page active in the PDF viewer.

### Misc

- Add a small convention note for when a todo should be promoted into its own epic/task doc.
- Periodically prune completed one-off todos from this file once they are represented elsewhere.
