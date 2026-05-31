import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ChevronRight, ChevronDown, FolderPlus, FilePlus, Trash2,
  FileCode2, Settings, Sparkles, LogOut, Folder, FileText, FolderTree,
  Bold, Italic, Underline, List, ListOrdered, Code, Link as LinkIcon, Palette,
  Search, X, CheckSquare, Table as TableIcon,
} from "lucide-react";
import {
  getWorkspace, getNotesByFolder, getNote,
  createFolder, createNote,
  updateNote, deleteNote, deleteFolder, deleteDirectory,
} from "@/lib/notes.functions";
import { getFontStack } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { usePromptDialog } from "@/components/PromptDialog";

export const Route = createFileRoute("/_authenticated/app")({
  validateSearch: (s: Record<string, unknown>) => ({ dir: typeof s.dir === "string" ? s.dir : undefined }),
  component: AppPage,
});

function AppPage() {
  const qc = useQueryClient();
  const { dir: dirParam } = Route.useSearch();
  const wsFn = useServerFn(getWorkspace);
  const notesFn = useServerFn(getNotesByFolder);
  const noteFn = useServerFn(getNote);

  
  const newFolderFn = useServerFn(createFolder);
  const newNoteFn = useServerFn(createNote);
  const saveNoteFn = useServerFn(updateNote);
  const delNoteFn = useServerFn(deleteNote);
  const delFolderFn = useServerFn(deleteFolder);
  const delDirFn = useServerFn(deleteDirectory);
  const prompt = usePromptDialog();

  const workspace = useQuery({ queryKey: ["workspace"], queryFn: () => wsFn() });

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");

  // Auto-expand directory passed via ?dir= and select its first folder
  useEffect(() => {
    if (!dirParam || !workspace.data) return;
    setExpandedDirs((s) => new Set([...s, dirParam]));
    const folderIds = workspace.data.folders
      .filter((f) => f.directory_id === dirParam)
      .map((f) => f.id);
    setActiveFolder((cur) => (cur && folderIds.includes(cur) ? cur : (folderIds[0] ?? null)));
    setActiveNoteId(null);
  }, [dirParam, workspace.data]);

  // Apply only the editor skin globally; fonts are scoped to the editor itself.
  useEffect(() => {
    const skin = workspace.data?.profile?.active_skin ?? "midnight";
    document.documentElement.setAttribute("data-skin", skin);
  }, [workspace.data?.profile?.active_skin]);

  const notesQuery = useQuery({
    queryKey: ["notes", activeFolder],
    queryFn: () => notesFn({ data: { folderId: activeFolder! } }),
    enabled: !!activeFolder,
  });

  const noteQuery = useQuery({
    queryKey: ["note", activeNoteId],
    queryFn: () => noteFn({ data: { id: activeNoteId! } }),
    enabled: !!activeNoteId,
  });

  const invalidateWs = () => qc.invalidateQueries({ queryKey: ["workspace"] });
  const invalidateNotes = () => {
    qc.invalidateQueries({ queryKey: ["notes", activeFolder] });
  };


  const addFolder = useMutation({
    mutationFn: async (directoryId: string) => {
      const name = await prompt.ask({
        title: "New folder",
        description: "Folders group related notes together.",
        placeholder: "Folder name",
        confirmLabel: "Create folder",
      });
      if (!name) return null;
      return newFolderFn({ data: { name, directoryId } });
    },
    onSuccess: () => invalidateWs(),
    onError: (e) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async (folderId: string) => newNoteFn({ data: { folderId } }),
    onSuccess: (n) => { invalidateNotes(); setActiveNoteId(n.id); },
    onError: (e) => toast.error(e.message),
  });

  const removeNote = useMutation({
    mutationFn: (id: string) => delNoteFn({ data: { id } }),
    onSuccess: () => { invalidateNotes(); setActiveNoteId(null); },
  });
  const removeFolder = useMutation({
    mutationFn: (id: string) => delFolderFn({ data: { id } }),
    onSuccess: () => { invalidateWs(); setActiveFolder(null); setActiveNoteId(null); },
  });
  const removeDir = useMutation({
    mutationFn: (id: string) => delDirFn({ data: { id } }),
    onSuccess: () => { invalidateWs(); setActiveFolder(null); setActiveNoteId(null); },
  });

  const saveNote = useMutation({
    mutationFn: (patch: { id: string; title?: string; content?: string }) =>
      saveNoteFn({ data: patch }),
    onSuccess: () => { invalidateNotes(); qc.invalidateQueries({ queryKey: ["note", activeNoteId] }); },
  });

  const ws = workspace.data;
  const folders = ws?.folders ?? [];
  const allDirs = ws?.directories ?? [];
  // When opened from a notebook (?dir=...), scope sidebar to JUST that notebook.
  const dirs = dirParam ? allDirs.filter((d) => d.id === dirParam) : allDirs;
  const currentDir = dirParam ? dirs[0] : null;
  const currentDirFolders = dirParam ? folders.filter((f) => f.directory_id === dirParam) : [];
  const isSubscribed = ws?.subscriptionActive ?? false;
  const searchTerm = folderSearch.trim().toLowerCase();
  const matchesSearch = (name: string) => !searchTerm || name.toLowerCase().includes(searchTerm);
  const visibleCurrentFolders = currentDirFolders.filter((f) => matchesSearch(f.name));

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-surface)" }}>
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition">
            <FileCode2 className="h-5 w-5 text-primary" />
            <span className="mono text-sm font-semibold text-sidebar-foreground">dev_notes</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {workspace.isLoading && <div className="px-4 text-xs text-muted-foreground mono">loading...</div>}
          {dirParam && currentDir && !workspace.isLoading && (
            <div className="px-4 pb-2 pt-1">
              <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-2">
                Current notebook
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-muted/40 px-3 py-2">
                <FolderTree className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-sidebar-foreground truncate">{currentDir.name}</span>
              </div>
            </div>
          )}
          {dirs.length === 0 && !workspace.isLoading && (
            <div className="px-4 py-8 text-center">
              <FolderTree className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground mb-3">No notebooks yet</p>
              <Link to="/home" className="text-xs mono text-primary hover:underline">
                go to home to create one
              </Link>
            </div>
          )}

          {dirParam && currentDir && !workspace.isLoading && (
            <div className="px-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] mono uppercase tracking-wider text-muted-foreground">Folders</span>
                <button
                  onClick={() => addFolder.mutate(currentDir.id)}
                  title="New folder"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="px-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                    placeholder="Search folders"
                    className="w-full pl-7 pr-7 py-1.5 text-xs rounded-md border border-sidebar-border bg-muted/40 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                  />
                  {folderSearch && (
                    <button
                      onClick={() => setFolderSearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Clear"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              {currentDirFolders.length === 0 && (
                <div className="text-xs text-muted-foreground mono py-2 px-2">empty</div>
              )}
              {currentDirFolders.length > 0 && visibleCurrentFolders.length === 0 && (
                <div className="text-xs text-muted-foreground mono py-2 px-2">no matches</div>
              )}
              {visibleCurrentFolders.map((f) => (
                <div
                  key={f.id}
                  className={`group flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition ${
                    activeFolder === f.id ? "bg-primary/15 text-foreground" : "hover:bg-muted/50"
                  }`}
                  onClick={() => { setActiveFolder(f.id); setActiveNoteId(null); }}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const ok = await prompt.ask({
                        title: `Delete "${f.name}"?`,
                        description: "This permanently removes the folder and all its notes.",
                        confirmOnly: true,
                        destructive: true,
                        confirmLabel: "Delete",
                        skipKey: "delete-folder",
                      });
                      if (ok !== null) removeFolder.mutate(f.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded transition active:scale-90"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}


          {!dirParam && dirs.map((d) => {
            const open = expandedDirs.has(d.id);
            const dirFolders = folders.filter((f) => f.directory_id === d.id);
            return (
              <div key={d.id} className="px-2">
                <div className="group flex items-center gap-1 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer">
                  <button
                    onClick={() =>
                      setExpandedDirs((s) => {
                        const n = new Set(s);
                        if (n.has(d.id)) n.delete(d.id);
                        else n.add(d.id);
                        return n;
                      })
                    }
                    className="flex items-center gap-1 flex-1 min-w-0 text-left"
                  >
                    {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                    <FolderTree className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-sm truncate text-sidebar-foreground">{d.name}</span>
                  </button>
                  <button
                    onClick={() => addFolder.mutate(d.id)}
                    title="New folder"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition"
                  >
                    <FolderPlus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await prompt.ask({
                        title: `Delete "${d.name}"?`,
                        description: "This permanently removes the notebook and everything inside it.",
                        confirmOnly: true,
                        destructive: true,
                        confirmLabel: "Delete",
                        skipKey: "delete-notebook",
                      });
                      if (ok !== null) removeDir.mutate(d.id);
                    }}
                    title="Delete"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded transition active:scale-90"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {open && (
                  <div className="ml-4 border-l border-sidebar-border pl-2">
                    {dirFolders.length === 0 && (
                      <div className="text-xs text-muted-foreground mono py-1 px-2">empty</div>
                    )}
                    {dirFolders.map((f) => (
                      <div
                        key={f.id}
                        className={`group flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition ${
                          activeFolder === f.id ? "bg-primary/15 text-foreground" : "hover:bg-muted/50"
                        }`}
                        onClick={() => { setActiveFolder(f.id); setActiveNoteId(null); }}
                      >
                        <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate flex-1">{f.name}</span>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok = await prompt.ask({
                              title: `Delete "${f.name}"?`,
                              description: "This permanently removes the folder and all its notes.",
                              confirmOnly: true,
                              destructive: true,
                              confirmLabel: "Delete",
                              skipKey: "delete-folder",
                            });
                            if (ok !== null) removeFolder.mutate(f.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded active:scale-90"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-sidebar-border p-2 flex items-center justify-between">
          <Link
            to="/skins"
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm flex-1"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Themes</span>
            {isSubscribed && <span className="ml-auto text-[10px] mono text-primary">PRO</span>}
          </Link>
          <Link to="/settings" className="p-2 rounded hover:bg-muted" title="Settings">
            <Settings className="h-4 w-4" />
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 rounded hover:bg-muted"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Notes list */}
      <div className="w-72 shrink-0 border-r border-border bg-card/30 flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium truncate">
            {activeFolder ? folders.find((f) => f.id === activeFolder)?.name : "Select a folder"}
          </span>
          {activeFolder && (
            <button
              onClick={() => addNote.mutate(activeFolder)}
              title="New note"
              className="p-1.5 rounded hover:bg-muted text-primary transition hover:scale-110 active:scale-95"
            >
              <FilePlus className="h-4 w-4" />
            </button>
          )}
        </div>
        {activeFolder && (notesQuery.data?.length ?? 0) > 0 && (
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder="Search notes"
                className="w-full pl-7 pr-7 py-1.5 text-xs rounded-md border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
              />
              {noteSearch && (
                <button
                  onClick={() => setNoteSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  title="Clear"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {!activeFolder && (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground mono">
              ← pick a folder
            </div>
          )}
          {activeFolder && notesQuery.data?.length === 0 && (
            <div className="px-4 py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground mb-2">No notes</p>
              <button
                onClick={() => addNote.mutate(activeFolder)}
                className="text-xs mono text-primary hover:underline"
              >
                + new note
              </button>
            </div>
          )}
          {(() => {
            const term = noteSearch.trim().toLowerCase();
            const visibleNotes = (notesQuery.data ?? []).filter((n) => {
              if (!term) return true;
              const title = (n.title || "").toLowerCase();
              const body = (n.content || "").replace(/<[^>]+>/g, " ").toLowerCase();
              return title.includes(term) || body.includes(term);
            });
            if (activeFolder && (notesQuery.data?.length ?? 0) > 0 && visibleNotes.length === 0) {
              return (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground mono">
                  no matches
                </div>
              );
            }
            return visibleNotes.map((n) => (
            <div
              key={n.id}
              onClick={() => setActiveNoteId(n.id)}
              className={`group relative w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition cursor-pointer ${
                activeNoteId === n.id ? "bg-primary/10" : ""
              }`}
            >
              <div className="font-medium text-sm truncate pr-8">{n.title || "Untitled"}</div>
              <div className="text-xs text-muted-foreground truncate mt-0.5 pr-8">
                {(n.content?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)) || "Empty"}
              </div>
              <div className="text-[10px] text-muted-foreground mono mt-1">
                {new Date(n.updated_at).toLocaleDateString()}
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = await prompt.ask({
                    title: `Delete "${n.title || "Untitled"}"?`,
                    description: "This permanently removes the note and its contents.",
                    confirmOnly: true,
                    destructive: true,
                    confirmLabel: "Delete",
                    skipKey: "delete-note",
                  });
                  if (ok !== null) {
                    if (activeNoteId === n.id) setActiveNoteId(null);
                    removeNote.mutate(n.id);
                  }
                }}
                title="Delete note"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition active:scale-90"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            ));
          })()}
        </div>
      </div>


      {/* Editor */}
      <main className="flex-1 flex flex-col">
        {!noteQuery.data && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileCode2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground mono">
                {activeFolder ? "select or create a note" : "no note selected"}
              </p>
            </div>
          </div>
        )}
        {noteQuery.data && (() => {
          const n = noteQuery.data;
          return (
            <NoteEditor
              key={n.id}
              note={n}
              headingFont={ws?.profile?.heading_font ?? "inter"}
              bodyFont={ws?.profile?.body_font ?? "inter"}
              onSave={(patch) => saveNote.mutate({ id: n.id, ...patch })}
              askLink={() =>
                prompt.ask({
                  title: "Insert link",
                  description: "Paste or type a URL. The selected text becomes a link.",
                  placeholder: "https://example.com",
                  confirmLabel: "Add link",
                })
              }
              askGrid={async () => {
                const raw = await prompt.ask({
                  title: "Insert grid",
                  description: "Enter dimensions as rows x columns (e.g. 3x4).",
                  placeholder: "3x3",
                  defaultValue: "3x3",
                  confirmLabel: "Insert grid",
                });
                if (!raw) return null;
                const m = raw.match(/^(\d+)\s*[x×*]\s*(\d+)$/i);
                if (!m) return null;
                const rows = Math.min(20, Math.max(1, parseInt(m[1], 10)));
                const cols = Math.min(20, Math.max(1, parseInt(m[2], 10)));
                return { rows, cols };
              }}
              onDelete={async () => {
                const ok = await prompt.ask({
                  title: "Delete this note?",
                  description: "This permanently removes the note and its contents.",
                  confirmOnly: true,
                  destructive: true,
                  confirmLabel: "Delete note",
                  skipKey: "delete-note",
                });
                if (ok !== null) removeNote.mutate(n.id);
              }}
            />
          );
        })()}
      </main>
      {prompt.node}
    </div>
  );
}

function NoteEditor({
  note,
  headingFont,
  bodyFont,
  onSave,
  onDelete,
  askLink,
  askGrid,
}: {
  note: { id: string; title: string; content: string };
  headingFont: string;
  bodyFont: string;
  onSave: (patch: { title?: string; content?: string }) => void;
  onDelete: () => void;
  askLink: () => Promise<string | null>;
  askGrid: () => Promise<{ rows: number; cols: number } | null>;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Initialize editor HTML once per note
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== note.content) {
      editorRef.current.innerHTML = note.content || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  // Debounced autosave
  useEffect(() => {
    const t = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        onSave({ title, content });
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const r = savedSelectionRef.current;
    if (!r) {
      editorRef.current?.focus();
      return;
    }
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }

  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [currentBlock, setCurrentBlock] = useState<string>("p");
  const [currentColor, setCurrentColor] = useState<string>("#a855f7");

  function rgbToHex(rgb: string): string {
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return rgb;
    const [r, g, b] = m.map(Number);
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  function normalizeBlockTag(value: string): string {
    const block = value.toLowerCase().replace(/[<>]/g, "").replace("heading ", "h");
    return block === "div" ? "p" : block;
  }

  function getCurrentBlockTag(): string {
    const sel = window.getSelection();
    const root = editorRef.current;
    let node = sel?.anchorNode ?? null;
    if (!node || !root?.contains(node)) return currentBlock;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    while (node && node !== root) {
      const tagName = (node as HTMLElement).tagName;
      if (tagName) {
        const tag = normalizeBlockTag(tagName);
        if (/^(h[1-6]|p|pre)$/.test(tag)) return tag;
      }
      node = node.parentNode;
    }
    const raw = String(document.queryCommandValue("formatBlock") || "p");
    return normalizeBlockTag(raw);
  }

  function refreshActiveFormats() {
    if (typeof document === "undefined") return;
    try {
      let block = getCurrentBlockTag();
      if (!/^(h[1-6]|p|pre)$/.test(block)) block = "p";
      setCurrentBlock(block);
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        pre: block === "pre",
      });
      const colorVal = String(document.queryCommandValue("foreColor") || "");
      if (colorVal) {
        setCurrentColor(colorVal.startsWith("rgb") ? rgbToHex(colorVal) : colorVal);
      }
    } catch {
      /* no-op */
    }
  }

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (sel?.anchorNode && editorRef.current?.contains(sel.anchorNode)) refreshActiveFormats();
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  function exec(command: string, value?: string) {
    // Selection is preserved by toolbar buttons' onMouseDown preventDefault.
    // Only focus if editor lost focus (e.g. after prompt() for link URL),
    // because focusing a focused editor can collapse the selection.
    if (document.activeElement !== editorRef.current) {
      editorRef.current?.focus();
      restoreSelection();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
    saveSelection();
    refreshActiveFormats();
    requestAnimationFrame(refreshActiveFormats);
  }

  function formatBlock(block: string) {
    editorRef.current?.focus();
    restoreSelection();
    const normalized = normalizeBlockTag(block);
    const values =
      normalized === "pre" ? ["PRE", "<pre>"] :
      normalized === "p" ? ["P", "<p>"] :
      [normalized.toUpperCase(), `<${normalized}>`];

    for (const value of values) {
      document.execCommand("formatBlock", false, value);
      if (getCurrentBlockTag() === normalized) break;
    }
    if (getCurrentBlockTag() !== normalized) replaceCurrentBlock(normalized);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
    saveSelection();
    refreshActiveFormats();
    requestAnimationFrame(refreshActiveFormats);
  }

  function replaceCurrentBlock(tag: string) {
    const root = editorRef.current;
    const sel = window.getSelection();
    if (!root || !sel?.anchorNode) return;
    let node: Node | null = sel.anchorNode.nodeType === Node.TEXT_NODE ? sel.anchorNode.parentNode : sel.anchorNode;
    while (node && node !== root) {
      const name = (node as HTMLElement).tagName;
      if (name && /^(H[1-6]|P|DIV|PRE)$/i.test(name)) break;
      node = node.parentNode;
    }
    if (!node || node === root) return;
    const next = document.createElement(tag === "p" ? "p" : tag);
    next.innerHTML = (node as HTMLElement).innerHTML || "<br>";
    node.parentNode?.replaceChild(next, node);
    const range = document.createRange();
    range.selectNodeContents(next);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function insertHTML(html: string) {
    if (document.activeElement !== editorRef.current) {
      editorRef.current?.focus();
      restoreSelection();
    }
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
    saveSelection();
    refreshActiveFormats();
  }

  function insertChecklist() {
    insertHTML(
      `<ul class="checklist" data-checklist="1"><li data-checked="false"><span class="check-box" contenteditable="false"></span><span class="check-text">New item</span></li></ul><p><br/></p>`,
    );
  }

  function insertGrid(rows: number, cols: number) {
    const rowsHtml = Array.from({ length: rows })
      .map(
        () =>
          `<tr>${Array.from({ length: cols })
            .map(() => `<td><br/></td>`)
            .join("")}</tr>`,
      )
      .join("");
    insertHTML(`<table class="grid-table"><tbody>${rowsHtml}</tbody></table><p><br/></p>`);
  }

  async function handleLink() {
    saveSelection();
    const url = await askLink();
    if (!url) return;
    const finalUrl = /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`;
    exec("createLink", finalUrl);
  }

  async function handleGrid() {
    saveSelection();
    const dims = await askGrid();
    if (!dims) return;
    insertGrid(dims.rows, dims.cols);
  }

  // Toggle checkbox clicks inside the editor
  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.classList?.contains("check-box")) {
      const li = target.closest("li");
      if (li) {
        const isChecked = li.getAttribute("data-checked") === "true";
        li.setAttribute("data-checked", isChecked ? "false" : "true");
        if (editorRef.current) setContent(editorRef.current.innerHTML);
      }
    }
  }

  const tools: Array<{ icon: any; label: string; action: () => void; activeKey?: string }> = [
    { icon: Bold, label: "Bold", action: () => exec("bold"), activeKey: "bold" },
    { icon: Italic, label: "Italic", action: () => exec("italic"), activeKey: "italic" },
    { icon: Underline, label: "Underline", action: () => exec("underline"), activeKey: "underline" },
    { icon: Code, label: "Code", action: () => formatBlock(getCurrentBlockTag() === "pre" ? "p" : "pre"), activeKey: "pre" },
    { icon: List, label: "Bulleted list", action: () => exec("insertUnorderedList"), activeKey: "insertUnorderedList" },
    { icon: ListOrdered, label: "Numbered list", action: () => exec("insertOrderedList"), activeKey: "insertOrderedList" },
    { icon: CheckSquare, label: "Checklist", action: insertChecklist },
    { icon: TableIcon, label: "Insert grid", action: handleGrid },
    { icon: LinkIcon, label: "Link", action: handleLink },
  ];

  const BLOCK_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "p", label: "Paragraph" },
    { value: "h1", label: "Heading 1" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
    { value: "h4", label: "Heading 4" },
    { value: "h5", label: "Heading 5" },
    { value: "h6", label: "Heading 6" },
  ];

  const editorHeadingStack = getFontStack(headingFont);
  const editorBodyStack = getFontStack(bodyFont);

  return (
    <>
      <div className="px-8 py-4 border-b border-border flex items-center justify-between gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent text-xl font-semibold focus:outline-none"
          style={{ fontFamily: editorHeadingStack }}
          maxLength={200}
          placeholder="Untitled"
        />
        <button
          onClick={onDelete}
          className="p-2 rounded hover:bg-destructive/20 hover:text-destructive transition"
          title="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-2 border-b border-border flex items-center gap-1 flex-wrap relative animate-fade-in">
        <select
          value={currentBlock.startsWith("h") || currentBlock === "p" ? currentBlock : "p"}
          onMouseDown={(e) => { saveSelection(); }}
          onChange={(e) => formatBlock(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs mono focus:outline-none focus:ring-1 focus:ring-ring hover:border-primary/60 transition cursor-pointer"
          title="Block type"
        >
          {BLOCK_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <div className="w-px h-5 bg-border mx-1" />
        {tools.map((t) => {
          const isActive = t.activeKey ? !!activeFormats[t.activeKey] : false;
          return (
            <button
              key={t.label}
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
              onClick={t.action}
              title={t.label}
              aria-pressed={isActive}
              className={`p-2 rounded transition-all duration-150 active:scale-90 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30 scale-105"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105"
              }`}
            >
              <t.icon className="h-4 w-4" />
            </button>
          );
        })}
        <div className="w-px h-5 bg-border mx-1" />
        <ColorPicker currentColor={currentColor} onPick={(color) => exec("foreColor", color)} />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => { setContent((e.target as HTMLDivElement).innerHTML); refreshActiveFormats(); }}
        onBlur={saveSelection}
        onKeyUp={() => { saveSelection(); refreshActiveFormats(); }}
        onMouseUp={() => { saveSelection(); refreshActiveFormats(); }}
        onClick={handleEditorClick}
        onFocus={refreshActiveFormats}
        data-placeholder="Start writing… use the toolbar for headings, lists, color, and more."
        className="prose-editor editor-paper flex-1 bg-transparent px-8 py-6 text-sm leading-relaxed focus:outline-none overflow-y-auto"
        style={{ fontFamily: editorBodyStack }}
      />

      <style>{`
        .prose-editor:empty:before {
          content: attr(data-placeholder);
          color: color-mix(in oklab, var(--muted-foreground) 70%, transparent);
          pointer-events: none;
        }
        .prose-editor h1 { font-size: 1.875rem; font-weight: 700; margin: 0.75rem 0 0.5rem; font-family: ${JSON.stringify(editorHeadingStack)}; }
        .prose-editor h2 { font-size: 1.5rem; font-weight: 650; margin: 0.75rem 0 0.5rem; font-family: ${JSON.stringify(editorHeadingStack)}; }
        .prose-editor h3 { font-size: 1.25rem; font-weight: 650; margin: 0.7rem 0 0.45rem; font-family: ${JSON.stringify(editorHeadingStack)}; }
        .prose-editor h4 { font-size: 1.1rem; font-weight: 650; margin: 0.65rem 0 0.4rem; font-family: ${JSON.stringify(editorHeadingStack)}; }
        .prose-editor h5 { font-size: 1rem; font-weight: 700; margin: 0.6rem 0 0.35rem; font-family: ${JSON.stringify(editorHeadingStack)}; text-transform: uppercase; letter-spacing: 0; }
        .prose-editor h6 { font-size: 0.9rem; font-weight: 700; margin: 0.55rem 0 0.3rem; font-family: ${JSON.stringify(editorHeadingStack)}; opacity: 0.8; letter-spacing: 0; }
        .prose-editor ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-editor ul ul { list-style: circle; }
        .prose-editor ul ul ul { list-style: square; }
        .prose-editor li { margin: 0.15rem 0; }
        .prose-editor pre { background: var(--muted); padding: 0.75rem; border-radius: 0.375rem; font-family: ui-monospace, monospace; font-size: 0.85em; overflow-x: auto; }
        .prose-editor a { color: var(--primary); text-decoration: underline; }
        .prose-editor p { margin: 0.25rem 0; }

        /* Apple-style checklist */
        .prose-editor ul.checklist {
          list-style: none;
          padding-left: 0.25rem;
          margin: 0.5rem 0;
        }
        .prose-editor ul.checklist li {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          margin: 0.25rem 0;
          padding: 0.15rem 0.25rem;
          border-radius: 0.375rem;
          transition: background-color 0.15s ease;
        }
        .prose-editor ul.checklist li:hover { background: color-mix(in oklab, var(--muted) 50%, transparent); }
        .prose-editor ul.checklist .check-box {
          flex-shrink: 0;
          width: 1.05rem;
          height: 1.05rem;
          margin-top: 0.18rem;
          border-radius: 999px;
          border: 1.5px solid color-mix(in oklab, var(--muted-foreground) 60%, transparent);
          background: transparent;
          cursor: pointer;
          display: inline-block;
          position: relative;
          transition: all 0.18s ease;
          user-select: none;
        }
        .prose-editor ul.checklist .check-box:hover {
          border-color: var(--primary);
          transform: scale(1.1);
        }
        .prose-editor ul.checklist li[data-checked="true"] .check-box {
          background: var(--primary);
          border-color: var(--primary);
        }
        .prose-editor ul.checklist li[data-checked="true"] .check-box:after {
          content: "";
          position: absolute;
          left: 4px;
          top: 1px;
          width: 5px;
          height: 9px;
          border: solid var(--primary-foreground);
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .prose-editor ul.checklist li[data-checked="true"] .check-text {
          text-decoration: line-through;
          opacity: 0.55;
        }
        .prose-editor ul.checklist .check-text { flex: 1; }

        /* Apple-style grid (table) */
        .prose-editor table.grid-table {
          border-collapse: separate;
          border-spacing: 0;
          margin: 0.75rem 0;
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          overflow: hidden;
          background: color-mix(in oklab, var(--background) 60%, transparent);
        }
        .prose-editor table.grid-table td {
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 0.5rem 0.65rem;
          min-width: 60px;
          vertical-align: top;
          transition: background-color 0.12s ease;
        }
        .prose-editor table.grid-table td:last-child { border-right: none; }
        .prose-editor table.grid-table tr:last-child td { border-bottom: none; }
        .prose-editor table.grid-table td:focus,
        .prose-editor table.grid-table td:focus-within {
          outline: none;
          background: color-mix(in oklab, var(--primary) 8%, transparent);
        }
      `}</style>
    </>
  );
}



const PRESET_COLORS: Array<{ name: string; value: string }> = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#a855f7" },
];

const CUSTOM_COLORS_KEY = "dev_notes_custom_colors";
const MAX_CUSTOM_COLORS = 3;

function ColorPicker({ onPick, currentColor }: { onPick: (color: string) => void; currentColor?: string }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("#ec4899");
  const [savedCustom, setSavedCustom] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_COLORS_KEY);
      if (raw) setSavedCustom(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function applyAndSaveCustom(color: string) {
    onPick(color);
    setSavedCustom((prev) => {
      const next = [color, ...prev.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(
        0,
        MAX_CUSTOM_COLORS,
      );
      try {
        localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="Text color"
        className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
      >
        <Palette className="h-4 w-4" />
        <span className="h-3 w-4 rounded-sm border border-border" style={{ background: currentColor ?? custom }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 w-72 rounded-lg border border-border bg-popover shadow-lg p-4 animate-scale-in">
          <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-2">
            Text color
          </div>
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(c.value);
                  setOpen(false);
                }}
                className="h-9 w-9 rounded-full border-2 border-border hover:scale-110 hover:shadow-md transition-transform"
                style={{ background: c.value }}
                title={c.name}
              />
            ))}
          </div>

          {savedCustom.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-2">
                Recent custom
              </div>
              <div className="flex items-center gap-2">
                {savedCustom.map((c) => (
                  <button
                    key={c}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onPick(c);
                      setOpen(false);
                    }}
                    className="h-8 w-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-2">
              Custom color
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="h-16 w-20 rounded cursor-pointer border border-border bg-transparent p-0"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs mono focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyAndSaveCustom(custom)}
                  className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
                >
                  Apply & Save
                </button>
              </div>
            </div>
            <p className="text-[10px] mono text-muted-foreground">
              Up to {MAX_CUSTOM_COLORS} saved custom colors.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
