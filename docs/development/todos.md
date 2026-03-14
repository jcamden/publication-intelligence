# Random Todos

### Detection

- Ignore excluded regions during detection runs for both matcher-based and LLM-based pipelines.
- Determine exclusion by fuzzy bounding-box comparison using the existing bbox utilities.
- Move matcher detection into a modal triggered by a button.
- Change ignore region highlight color from red to a more opaque white.

### Index Page

- Use canonical page numbers instead of document page numbers on the Index page.
- If a canonical page number does not yet exist, fall back to the document page number.
- When falling back, show both the page number and an exclamation mark in red so the mismatch is obvious.
- Nice-to-have: clicking the red page number should navigate to the Editor with that page active in the PDF viewer.

### Auth

- Fix the auth flow so the form state doesn't revert before navigating after successful authentication.

### Index Editor

- Move the create-entry and create-group buttons out of `EntryTree`.
- Make `EntryTree` scrollable.
- Fix entry tree scroll area.
- Fix the numerous drag-and-drop issues in `EntryTree`.
- Make `EntryTree` filterable/searchable.
- Add section colors to the window component.

### Page Sidebar

- Make `IndexMentions` scrollable in the page sidebar.
- Make `IndexMentions` filterable/searchable in the page sidebar.

### Project Flow

- Fix the "PDF not found" error when navigating to the Editor too quickly after creating a project.
- Remove or fix index types in the create/edit project modal.
- Fix editor showing locally cached data for a deleted project when opening a different project with the same name.
  - Delete project-specific localStorage when deleting a project.
  - Consider clearing stale localStorage by project ID when projects load.

### Mention Geometry

- Horizontally join multiple bounding boxes on the same line for `IndexMentions` that have multiple bounding boxes.
    - Prefer merging those bounding boxes before saving the `IndexMention`; alternatively, handle the merge in highlight rendering if persistence-layer merging is not appropriate.
