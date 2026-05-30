import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ChevronRight, ChevronDown, FolderPlus, FilePlus, Trash2,
  FileCode2, Settings, Sparkles, LogOut, Folder, FileText, FolderTree, Home,
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Quote, Code, Link as LinkIcon, Type, Palette,
} from "lucide-react";
import {
  getWorkspace, getNotesByFolder, getNote,
  createDirectory, createFolder, createNote,
  updateNote, deleteNote, deleteFolder, deleteDirectory, updateProfile,
} from "@/lib/notes.functions";
import { FONTS, getFontStack } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

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

  const newDirFn = useServerFn(createDirectory);
  const newFolderFn = useServerFn(createFolder);
  const newNoteFn = useServerFn(createNote);
  const saveNoteFn = useServerFn(updateNote);
  const delNoteFn = useServerFn(deleteNote);
  const delFolderFn = useServerFn(deleteFolder);
  const delDirFn = useServerFn(deleteDirectory);

  const workspace = useQuery({ queryKey: ["workspace"], queryFn: () => wsFn() });

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

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

  const addDir = useMutation({
    mutationFn: async () => {
      const name = prompt("Directory name");
      if (!name) return null;
      return newDirFn({ data: { name } });
    },
    onSuccess: (d) => { if (d) { invalidateWs(); setExpandedDirs((s) => new Set([...s, d.id])); } },
    onError: (e) => toast.error(e.message),
  });

  const addFolder = useMutation({
    mutationFn: async (directoryId: string) => {
      const name = prompt("Folder name");
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

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-surface)" }}>
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition">
            <FileCode2 className="h-5 w-5 text-primary" />
            <span className="mono text-sm font-semibold text-sidebar-foreground">dev_notes</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/home" title="All notebooks" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition">
              <Home className="h-4 w-4" />
            </Link>
            <button
              onClick={() => addDir.mutate()}
              title="New notebook"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <FolderTree className="h-4 w-4" />
            </button>
          </div>
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
              <p className="text-xs text-muted-foreground mb-3">No directories yet</p>
              <button
                onClick={() => addDir.mutate()}
                className="text-xs mono text-primary hover:underline"
              >
                + create one
              </button>
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
              {currentDirFolders.length === 0 && (
                <div className="text-xs text-muted-foreground mono py-2 px-2">empty</div>
              )}
              {currentDirFolders.map((f) => (
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
                    onClick={(e) => { e.stopPropagation(); confirm(`Delete folder "${f.name}"?`) && removeFolder.mutate(f.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded"
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
                        n.has(d.id) ? n.delete(d.id) : n.add(d.id);
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
                    onClick={() => confirm(`Delete "${d.name}" and everything inside?`) && removeDir.mutate(d.id)}
                    title="Delete"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded transition"
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
                          onClick={(e) => { e.stopPropagation(); confirm(`Delete folder "${f.name}"?`) && removeFolder.mutate(f.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded"
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
              className="p-1.5 rounded hover:bg-muted text-primary"
            >
              <FilePlus className="h-4 w-4" />
            </button>
          )}
        </div>
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
          {notesQuery.data?.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveNoteId(n.id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition ${
                activeNoteId === n.id ? "bg-primary/10" : ""
              }`}
            >
              <div className="font-medium text-sm truncate">{n.title || "Untitled"}</div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {(n.content?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)) || "Empty"}
              </div>
              <div className="text-[10px] text-muted-foreground mono mt-1">
                {new Date(n.updated_at).toLocaleDateString()}
              </div>
            </button>
          ))}
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
              onDelete={() => confirm("Delete this note?") && removeNote.mutate(n.id)}
            />
          );
        })()}
      </main>
    </div>
  );
}

function NoteEditor({
  note,
  headingFont,
  bodyFont,
  onSave,
  onDelete,
}: {
  note: { id: string; title: string; content: string };
  headingFont: string;
  bodyFont: string;
  onSave: (patch: { title?: string; content?: string }) => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const profileFn = useServerFn(updateProfile);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const setFont = useMutation({
    mutationFn: (data: { heading_font?: string; body_font?: string }) => profileFn({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Editor font updated"); },
    onError: (e) => toast.error((e as Error).message),
  });

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

  function refreshActiveFormats() {
    if (typeof document === "undefined") return;
    try {
      const formatBlock = String(document.queryCommandValue("formatBlock") || "").toLowerCase();
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        h1: formatBlock === "h1" || formatBlock === "heading 1",
        h2: formatBlock === "h2" || formatBlock === "heading 2",
        blockquote: formatBlock === "blockquote",
        pre: formatBlock === "pre",
      });
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
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
    requestAnimationFrame(refreshActiveFormats);
  }

  const tools: Array<{ icon: any; label: string; action: () => void; activeKey?: string }> = [
    { icon: Heading1, label: "Heading 1", action: () => exec("formatBlock", "H1"), activeKey: "h1" },
    { icon: Heading2, label: "Heading 2", action: () => exec("formatBlock", "H2"), activeKey: "h2" },
    { icon: Bold, label: "Bold", action: () => exec("bold"), activeKey: "bold" },
    { icon: Italic, label: "Italic", action: () => exec("italic"), activeKey: "italic" },
    { icon: Underline, label: "Underline", action: () => exec("underline"), activeKey: "underline" },
    { icon: Code, label: "Code", action: () => exec("formatBlock", "PRE"), activeKey: "pre" },
    { icon: Quote, label: "Quote", action: () => exec("formatBlock", "BLOCKQUOTE"), activeKey: "blockquote" },
    { icon: List, label: "Bulleted list", action: () => exec("insertUnorderedList"), activeKey: "insertUnorderedList" },
    { icon: ListOrdered, label: "Numbered list", action: () => exec("insertOrderedList"), activeKey: "insertOrderedList" },
    {
      icon: LinkIcon,
      label: "Link",
      action: () => {
        const url = prompt("URL");
        if (url) exec("createLink", url);
      },
    },
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
      <div className="px-8 py-2 border-b border-border flex items-center gap-1 flex-wrap relative">
        {tools.map((t) => {
          const isActive = t.activeKey ? !!activeFormats[t.activeKey] : false;
          return (
            <button
              key={t.label}
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
              onClick={t.action}
              title={t.label}
              aria-pressed={isActive}
              className={`p-2 rounded transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
            </button>
          );
        })}
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={() => setShowFontPicker((v) => !v)}
          title="Editor font settings"
          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 text-xs mono"
        >
          <Type className="h-4 w-4" /> Fonts
        </button>
        <ColorPicker onPick={(color) => exec("foreColor", color)} />


        {showFontPicker && (
          <div className="absolute top-full right-8 mt-1 z-20 w-80 rounded-lg border border-border bg-popover shadow-lg p-3 space-y-3">
            <FontSelect
              label="Heading font"
              value={headingFont}
              onChange={(id) => setFont.mutate({ heading_font: id })}
            />
            <FontSelect
              label="Body font"
              value={bodyFont}
              onChange={(id) => setFont.mutate({ body_font: id })}
            />
            <p className="text-[10px] mono text-muted-foreground">
              Applied to the editor only.
            </p>
          </div>
        )}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => { setContent((e.target as HTMLDivElement).innerHTML); refreshActiveFormats(); }}
        onBlur={saveSelection}
        onKeyUp={() => { saveSelection(); refreshActiveFormats(); }}
        onMouseUp={() => { saveSelection(); refreshActiveFormats(); }}
        onFocus={refreshActiveFormats}
        data-placeholder="Start writing… use the toolbar for headings, lists, color, and more."
        className="prose-editor flex-1 bg-transparent px-8 py-6 text-sm leading-relaxed focus:outline-none overflow-y-auto"
        style={{ fontFamily: editorBodyStack }}
      />

      <style>{`
        .prose-editor:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground) / 0.7);
          pointer-events: none;
        }
        .prose-editor h1 { font-size: 1.875rem; font-weight: 700; margin: 0.75rem 0 0.5rem; font-family: ${JSON.stringify(editorHeadingStack)}; }
        .prose-editor h2 { font-size: 1.5rem; font-weight: 600; margin: 0.75rem 0 0.5rem; font-family: ${JSON.stringify(editorHeadingStack)}; }
        .prose-editor ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-editor li { margin: 0.15rem 0; }
        .prose-editor blockquote { border-left: 3px solid hsl(var(--primary)); padding-left: 0.75rem; color: hsl(var(--muted-foreground)); margin: 0.5rem 0; }
        .prose-editor pre { background: hsl(var(--muted)); padding: 0.75rem; border-radius: 0.375rem; font-family: ui-monospace, monospace; font-size: 0.85em; overflow-x: auto; }
        .prose-editor a { color: hsl(var(--primary)); text-decoration: underline; }
        .prose-editor p { margin: 0.25rem 0; }
      `}</style>
    </>
  );
}


function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {FONTS.map((f) => (
          <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
            {f.name} ({f.category})
          </option>
        ))}
      </select>
    </div>
  );
}

const PRESET_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];

function ColorPicker({ onPick }: { onPick: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("#ec4899");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="Text color"
        className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
      >
        <Palette className="h-4 w-4" />
        <span className="h-2 w-4 rounded-sm" style={{ background: custom }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 w-56 rounded-lg border border-border bg-popover shadow-lg p-3">
          <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-2">Text color</div>
          <div className="flex items-center gap-2 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPick(c); setOpen(false); }}
                className="h-7 w-7 rounded-full border-2 border-border hover:scale-110 transition"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <div className="border-t border-border pt-3">
            <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-2">Custom</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border border-border bg-transparent"
              />
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPick(custom); setOpen(false); }}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
