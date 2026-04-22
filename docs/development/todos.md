# Random Todos

Grab-bag of things to do, grouped loosely by area. Expected to churn.

### Detection

- Ignore excluded regions during detection runs for both matcher-based and LLM-based pipelines.
- Determine exclusion by fuzzy bounding-box comparison using the existing bbox utilities.
- Move matcher detection into a modal triggered by a button.
- Change ignore region highlight color from red to a more opaque white.
- Prompt refinement: if phrase *contains* exact text of entry, only highlight exact text. Also need to pass all pre-existing entries.
- Prompts should receive list of existing matchers.
- Matchers should be associated with definitions. AI will need to choose from those matchers or create a new matcher with a new definition. A subsequent task would try to identify which canonical definition matches the new matcher's definition (may have to send to LLM for identification).
- When adding text that is not already in a matcher to an entry, ask "Do you want to add to matchers for entry?".
- "Region highlights became contexts" — revisit terminology / model.
- Investigate [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) for scanned PDFs.
- Work on author and scripture indexing.

### Index Page

- Use canonical page numbers instead of document page numbers on the Index page.
- If a canonical page number does not yet exist, fall back to the document page number.
- When falling back, show both the page number and an exclamation mark in red so the mismatch is obvious.
- Nice-to-have: clicking the red page number should navigate to the Editor with that page active in the PDF viewer.

### Auth / Settings

- Fix the auth flow so the form state doesn't revert before navigating after successful authentication. Consider showing a loading state instead of resetting the form.
- Unauthed rerouting after auth: route back to the previous route after sign-in.
- OpenRouter key should be user-level (currently global or project-level).

### Navigation

- Settings page back buttons should route back to the previous route.

### Index Editor

- split up EntryTree
- Move the create-entry and create-group buttons out of `EntryTree`.
- Make `EntryTree` scrollable and filterable/searchable.
- Fix entry tree scroll area.
- Fix the numerous drag-and-drop issues in `EntryTree`.
- Add section colors to the window component.
- Move region and text buttons to the PDF toolbar; add a type selector next to them. Keep them on until toggled off.
- Replace full header and content color with probably just a colored icon for accordion items.
- Fix up the Create/Edit region form.
- Move "no entries yet" to below the Create Entry button.
- Swap mention count on entries to the inside; add a menu.
- Allow the Index highlight layer to be disabled.
- Support delete / rename / merge of `IndexEntry`s.
- Fix cross-reference formatting.
- Transfer mentions for "See" cross-reference type — ask "Do you want to transfer mentions?" and "Do you want to transfer matchers?".
- Still allow creating a new entry from `mention-creation-popover` even if a match is found (e.g. "Israel" finds "Israelite").
- `testid` surfaces for parent of child entry when creating a child entry.
- bug: can't update page region (i.e. every other starting on 1 to starting on 2)
   - add delete button to edit region modal
- make exclude regions PER index type (i.e. exclude scripture only)

### Page Sidebar

- Make `IndexMentions` scrollable.
- Make `IndexMentions` filterable/searchable.
- Reorder default page-bar items.

### Project Flow

- Fix the "PDF not found" error when navigating to the Editor too quickly after creating a project.
- Remove or fix index types in the create/edit project modal.
- Fix editor showing locally cached data for a deleted project when opening a different project with the same name.
  - Delete project-specific `localStorage` when deleting a project.
  - Consider clearing stale `localStorage` by project ID when projects load.
- `localStorage` stuff should be scoped to user; when an account is deleted, clear all of that user's entries.

### Mention Geometry

- Horizontally join multiple bounding boxes on the same line for `IndexMentions` that have multiple bounding boxes.
    - Prefer merging those bounding boxes before saving the `IndexMention`; alternatively, handle the merge in highlight rendering if persistence-layer merging is not appropriate.
- Order z-index of highlights from smallest to largest so smaller ones are never unclickable/obscured.
- Probably, mentions should only have one type. (Perhaps display a mixed highlight if bboxes are exactly the same for two mentions.)
