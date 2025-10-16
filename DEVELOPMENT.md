## Development Guide

This project is a Turbo/Next.js monorepo. These instructions are tailored for Windows PowerShell and avoid command chaining [[memory:5632326]].

### Prerequisites
- Windows 10/11
- Git
- Node.js (choose ONE):
  - Option A: Install via MSI: `https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi` (open a new PowerShell after install)
  - Option B: Use the portable Node bundled in this repo at `.tools\node\node-v20.18.0-win-x64`

### One‑click start/stop (recommended)
- Start: double‑click `start.cmd`
- Stop: double‑click `stop.cmd`

These scripts handle PATH setup for the portable Node and run the `apps/web` dev server on `http://localhost:3000`.

### First‑time setup (manual)
Run commands separately (no `&&`) [[memory:5632326]]. If you’re using the portable Node, prepend PATH for the session:

```powershell
cd "C:\Users\Admin\Dropbox\Cursor Projects\contentbuider"
$env:Path = "$PWD\.tools\node\node-v20.18.0-win-x64;$env:Path"
node -v
npm -v
```

Install dependencies at the repo root:

```powershell
npm install
```

Start the dev server (choose ONE):

```powershell
# Preferred (runs the web app workspace)
npm run start:windows

# Or directly from the workspace
npm run --workspace web dev
```

Open `http://localhost:3000`.

### Stopping the dev server
- Run:

```powershell
npm run stop:windows
```

- Or double‑click `stop.cmd`

### Troubleshooting
- "npm is not recognized":
  - New PowerShell session may not have PATH set. Run:
    ```powershell
    $env:Path = "$PWD\.tools\node\node-v20.18.0-win-x64;$env:Path"
    ```
  - Or use the MSI install and open a new PowerShell window.

- Port 3000 already in use:
  - Run the stop script:
    ```powershell
    npm run stop:windows
    ```

- Turbo complains: "Missing packageManager field in package.json":
  - The root `package.json` includes `"packageManager": "npm@10.8.2"`. If missing, add it and retry.

- JSON error in `apps/web/package.json`:
  - Ensure it begins with `{` (no stray characters) and is valid JSON. The repo contains a corrected file.

### Notes
- Run commands one‑by‑one (no piping/chaining) to avoid PowerShell parsing issues [[memory:5632326]].
- Node version used: 20.18.0; npm: 10.8.2.

## Editor behavior (blocks + slash menu)

### What you see now
- Blank canvas by default. No blocks are rendered until you create them.
- Type "/" anywhere to open the slash menu. Click an item to insert a block:
  - Heading 1 / Heading 2: rendered H1/H2 with proper sizes and weight.
  - Text: a paragraph block.
  - Bulleted list / Numbered list: list blocks.
  - Quote: styled blockquote.
  - Divider: horizontal rule.
- Blocks are WYSIWYG; HTML is not shown in the UI.
- Clicking below the last block focuses the end so you can type "/" to add the next block.
- Reordering handles are currently disabled (no grabber). We can re‑enable later.

### Implementation details
- Editor package: `packages/editor` using Tiptap (`StarterKit`, `Placeholder`, custom `SlashCommand`).
- Slash commands insert blocks as nodes (not toggles) for deterministic results:
  - Headings use `setNode('heading', { level: 1|2 })`.
  - Lists normalize to a paragraph before `toggle*List()` to ensure a clean block.
  - Selecting a menu item removes the typed "/..." query, applies the command, and closes the menu.
- Minimal prose styles live in `apps/web/src/app/globals.css` under the `.prose` rules to render H1/H2, lists, quotes, and dividers at sensible sizes without extra plugins.
- The app page (`apps/web/src/app/page.tsx`) renders only the editor; the raw HTML preview was removed.

### Slash Menu (Notion-like UI)
The slash menu now features:
- **Modern icons** from Lucide React for all block types
- **Organized categories**: Basic (text & headings), Lists, Advanced (quotes, code, dividers)
- **Live preview panel**: Right-side panel renders actual preview of each block with proper styling
  - Headings show in their actual sizes (H1 large, H2 medium, H3 small)
  - Lists, quotes, code blocks, and dividers preview their appearance
- **Enhanced styling**: Smooth hover states, blue highlight for selected items, keyboard navigation
- **Keyboard shortcuts**: Arrow keys to navigate, Enter to select, Escape to close
- **Smart search**: Type after "/" to filter commands by name

### Customization
- Add or reorder slash items in `packages/editor/src/extensions/slash-command.tsx` (`defaultCommands`).
  - Each item requires: title, description, section, icon (Lucide component), preview text, command function
- Tweak rendering sizes in `apps/web/src/app/globals.css` under the `.prose` selectors.
  - All blocks default to 10px top and bottom margins for consistent spacing
- Re‑enable block drag/reorder by restoring the `DragHandle` extension import in `rich-editor.tsx` (left out by design for now).

### Drag and Drop
Block reordering via drag and drop has been significantly improved with the following fixes:
- **Fixed handle visibility**: Only one drag handle shows at a time (previously multiple could be visible)
- **Standardized HR handle**: Horizontal rule now uses consistent positioning (-32px left) and styling (18px × 24px)
- **Improved HR targeting**: HR block height increased from 20px to 40px for easier drop accuracy
- **Smooth transitions**: All handles now have consistent opacity transitions
- **Better hover behavior**: Handles only appear when hovering directly over their block
- **CRITICAL: No nesting/splitting**: Blocks now ALWAYS drop between top-level blocks, never inside them
  - Completely rewrote `findTopLevelPosFromCoords` to use DOM-based block detection
  - **Fixes gap handling**: Hovering in gaps between blocks now works correctly
    - Old approach used `posAtCoords` which gave inconsistent results in gaps (CSS margins)
    - New approach finds closest top-level DOM element and maps directly to it
    - Indicator and drop now match perfectly, even when hovering between blocks
  - Fixed DOM element resolution to traverse up to top-level `.ProseMirror` children
  - Both dragover (indicator) and drop (actual) use identical logic
  - Prevents blocks from being dropped inside lists, blockquotes, or other containers
  - Prevents text from being split across multiple blocks  
  - Even when hovering over list items, drops happen before/after the entire list
  - Improved no-op detection prevents unnecessary operations
- **Adaptive edge snap**: Drop zones now scale with block height (25% of height, min 6px, max 16px)
  - Prevents overlap on small blocks (24px blocks now have 6px edge zones with 12px middle zone)
  - Maintains good UX on large blocks (60px blocks have 15px edge zones)
- **Accurate drop indicator**: Blue indicator line now shows exactly where the block will drop
  - Thicker (3px) and more visible with shadow and border radius
  - Indicator position matches actual drop position
- **Consistent drop logic**: Both dragover (indicator) and drop (actual) use identical calculations

### Next enhancements (optional)
- Keyboard move up/down for blocks.
- More blocks: to‑do list, toggle list, callouts, images, embeds, tables.
- Improved drop indicators with animations.

