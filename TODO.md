# Project TODO List

## High Priority Bugs

- [ ] **Double Input / Echo Bug in Text Input**
  - **Symptoms:** When typing in the chat input box, each character appears twice. Deleting a character also removes two characters.
  - **Status:** Unresolved.
  - **Attempted Fixes:**
    1.  Removed `keys: true` from the `chatLog` component. This did not solve the problem.
  - **Next Steps:** Investigate other potential sources of the event duplication. Add debug logging to trace which component has focus during a `keypress` event.

## Future Features

- [ ] **SQLite Integration:** Replace the in-memory `ChatManager` with a database-backed version for true persistence.
- [ ] **Agent & Knowledge Base Views:** Implement the UI and logic for the placeholder "Agent" and "知识库" views.
- [ ] **Polish UI/UX:** Improve visual elements, add loading indicators, and refine component interactions.
- [ ] **Packaging for `npx`:** Restore `stricli` functionality and configure `package.json` for publishing.
