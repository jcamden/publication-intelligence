unauthed rerouting after auth (routing back to previous route)
settings back buttons (routing back to previous route)

after auth (signup), form resets before the page redirects. Can we show loading instead or something?

move region and text buttons to PDF toolbar and add a type selector next to them.
    keep them on until toggled off

Replace full header and content color with probably just colored icon for accordion items.

fix up Create/Edit region form

move no entries yet to below the Create Entry button

order z index of highlights from smallest to largest (so smaller are never unclickable/obscured)?

testid surfaces for parent of child entry when creating child entry

https://github.com/ocrmypdf/OCRmyPDF

localStorage stuff should be scoped to user
    When we delete an account we should clear all stuff for user from localStorage

region highlights became contexts

openrouter key should be user-level

delete, rename, or merge IndexEntries

probably swap mention count on entries to the inside, add menu

prompt: if phrase *contains* exact text of entry, only highlight exact text
    - Also need to pass all pre-existing entries.

prompts should receive list of existing matchers

matchers should be associated with definitions
   AI will need to choose from those matchers or create a new matcher with a new definition
   A subsequent task would try to identify which canonical definition matches the new matcher's definition (may have to send to LLM for identification)