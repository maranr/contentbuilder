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

### Customization
- Add or reorder slash items in `packages/editor/src/extensions/slash-command.tsx` (`defaultCommands`).
- Tweak rendering sizes in `apps/web/src/app/globals.css` under the `.prose` selectors.
- Re‑enable block drag/reorder by restoring the `DragHandle` extension import in `rich-editor.tsx` (left out by design for now).

### Next enhancements (optional)
- Notion‑like slash UI with icons, categories, and right‑side previews.
- Keyboard move up/down for blocks; optional subtle drag with drop indicators.
- More blocks: H3, to‑do list, toggle list, callouts, images, embeds.

