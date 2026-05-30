# Fixes & Improvements

## 1. Notebook covers respect ownership + are per-notebook

**Problem:** Home page applies the globally-selected `active_notebook_skin` to every notebook, even if the user hasn't purchased that theme. Also, all notebooks share one cover — there's no way to theme an individual notebook.

**Changes:**
- Add a `cover_skin` column to the `directories` table (text, default `'nb_default'`) via migration.
- Extend `notes.functions.ts`:
  - `getWorkspace` already returns directories — they'll now include `cover_skin`.
  - Add `updateDirectory({ id, cover_skin })` server fn (validates skin id is one the user owns: free, in `purchased_skins`, or has active subscription).
- On `/home`:
  - Render each notebook's cover from its own `cover_skin` (falling back to default rotating gradients if `nb_default` or skin not owned).
  - Add a small gear/palette button (visible on hover) on each notebook card. Clicking opens a popover showing only **owned** notebook themes as swatches. Selecting one calls `updateDirectory`.
- Remove the global `active_notebook_skin` driver from the home cover rendering (we keep the column for backward compat / default for newly created notebooks, but per-notebook value wins).
- New notebooks default to `nb_default` so creating a notebook never silently applies an unpurchased theme.

## 2. Editor: real text color + real bullet lists

**Problem:** The editor is a plain `<textarea>` so it shows raw `<span style="color:…">` and `- ` literally — colors don't render and bullets are just dashes.

**Change:** Replace the textarea with a `contentEditable` div editor:
- Use `document.execCommand` for: bold, italic, headings (formatBlock h1/h2), blockquote, code, unordered/ordered list, link, and **`foreColor`** for the color picker. This gives real bullets, real numbered lists, and real colored text.
- Persist `innerHTML` as the note `content` (already a TEXT column — no schema change).
- Toolbar buttons updated to call the new commands; existing `wrap`/`linePrefix` markdown helpers removed.
- Plain-text fallback for the notes-list preview: strip HTML when computing the snippet.
- Title input stays a plain `<input>`.

## 3. Editor fonts scoped to the editor only

**Problem:** Font picker writes `--font-heading` / `--font-body` to `document.documentElement`, restyling the entire app (sidebar, home, settings, themes page).

**Change:**
- Stop setting `--font-heading` / `--font-body` on `documentElement` in `app.tsx`, `home.tsx`, `skins.tsx`.
- Apply the fonts only on the editor container via inline `style={{ fontFamily: headingFont/bodyFont }}` on the title and content elements (resolved via `getFontStack`).
- Update toolbar copy: "Applied to your entire workspace" → "Applied to the editor only".

## Technical details

**Migration:**
```sql
ALTER TABLE public.directories
  ADD COLUMN cover_skin text NOT NULL DEFAULT 'nb_default';
```
(No new GRANT/RLS needed — existing `directories_all_own` policy already covers it.)

**Files touched:**
- `supabase/migrations/<new>.sql` — add column
- `src/lib/notes.functions.ts` — add `updateDirectory`, accept `cover_skin` in zod
- `src/routes/_authenticated/home.tsx` — per-notebook cover, theme popover, ownership gate
- `src/routes/_authenticated/app.tsx` — contentEditable editor, execCommand toolbar, scoped fonts, "Skins"→"Themes" sidebar label cleanup
- `src/routes/_authenticated/skins.tsx` — stop writing fonts to `documentElement`

**Out of scope:** redesigning the toolbar layout, markdown export, undo/redo polish beyond the browser default.
