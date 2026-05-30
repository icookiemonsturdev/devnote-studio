import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BookOpen, Plus, Settings, Sparkles, LogOut, FileCode2, Trash2, Palette, Check, Lock,
} from "lucide-react";
import { getWorkspace, createDirectory, deleteDirectory, updateDirectory } from "@/lib/notes.functions";
import { NOTEBOOK_SKINS } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

const DEFAULT_COVERS = [
  "linear-gradient(135deg, hsl(244 70% 50%), hsl(280 70% 55%))",
  "linear-gradient(135deg, hsl(200 80% 45%), hsl(180 70% 50%))",
  "linear-gradient(135deg, hsl(20 85% 55%), hsl(340 75% 55%))",
  "linear-gradient(135deg, hsl(150 60% 40%), hsl(180 65% 45%))",
  "linear-gradient(135deg, hsl(45 90% 55%), hsl(20 85% 55%))",
  "linear-gradient(135deg, hsl(280 65% 55%), hsl(320 70% 55%))",
  "linear-gradient(135deg, hsl(220 70% 45%), hsl(260 65% 55%))",
  "linear-gradient(135deg, hsl(160 60% 40%), hsl(220 70% 50%))",
];

function HomePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const wsFn = useServerFn(getWorkspace);
  const newDirFn = useServerFn(createDirectory);
  const delDirFn = useServerFn(deleteDirectory);
  const updateDirFn = useServerFn(updateDirectory);

  const workspace = useQuery({ queryKey: ["workspace"], queryFn: () => wsFn() });

  useEffect(() => {
    const skin = workspace.data?.profile?.active_skin ?? "midnight";
    document.documentElement.setAttribute("data-skin", skin);
  }, [workspace.data?.profile?.active_skin]);

  const addDir = useMutation({
    mutationFn: async () => {
      const name = prompt("Notebook name");
      if (!name) return null;
      return newDirFn({ data: { name } });
    },
    onSuccess: (d) => {
      if (d) {
        qc.invalidateQueries({ queryKey: ["workspace"] });
        navigate({ to: "/app", search: { dir: d.id } });
      }
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const removeDir = useMutation({
    mutationFn: (id: string) => delDirFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const setCover = useMutation({
    mutationFn: (vars: { id: string; cover_skin: string }) =>
      updateDirFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const ws = workspace.data;
  const dirs = ws?.directories ?? [];
  const folders = ws?.folders ?? [];
  const isSubscribed = ws?.subscriptionActive ?? false;
  const purchased = ws?.purchasedSkins ?? [];

  const ownedSkinIds = new Set<string>(
    NOTEBOOK_SKINS.filter((s) => s.free || isSubscribed || purchased.includes(s.id)).map((s) => s.id),
  );

  const coverFor = (dir: { cover_skin?: string | null }, i: number) => {
    const skinId = dir.cover_skin ?? "nb_default";
    // Only honor the chosen skin if user actually owns it; otherwise fall back.
    if (!ownedSkinIds.has(skinId)) return DEFAULT_COVERS[i % DEFAULT_COVERS.length];
    const skin = NOTEBOOK_SKINS.find((s) => s.id === skinId);
    return skin?.cover ?? DEFAULT_COVERS[i % DEFAULT_COVERS.length];
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-surface)" }}>
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-primary" />
            <span className="mono text-sm font-semibold">dev_notes</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/skins" className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm hover:bg-muted transition">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Themes</span>
              {isSubscribed && <span className="text-[10px] mono text-primary ml-1">PRO</span>}
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
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Your notebooks</h1>
          <p className="text-sm text-muted-foreground">
            {dirs.length === 0
              ? "Create your first notebook to get started."
              : `${dirs.length} notebook${dirs.length === 1 ? "" : "s"} · ${folders.length} folder${folders.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dirs.map((d, i) => {
            const folderCount = folders.filter((f) => f.directory_id === d.id).length;
            const cover = coverFor(d as any, i);
            return (
              <div
                key={d.id}
                className="group relative rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1"
              >
                <button
                  onClick={() => navigate({ to: "/app", search: { dir: d.id } })}
                  className="block w-full text-left"
                >
                  <div
                    className="aspect-[4/5] p-5 flex flex-col justify-between relative"
                    style={{ background: cover }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/20" />
                    <div className="flex items-start justify-between">
                      <BookOpen className="h-6 w-6 text-white/90" />
                    </div>
                    <div>
                      <div className="text-xs mono text-white/70 mb-1">NOTEBOOK</div>
                      <div className="text-lg font-semibold text-white line-clamp-2">
                        {d.name}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Floating action buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <CoverPicker
                    currentSkin={(d as any).cover_skin ?? "nb_default"}
                    ownedSkinIds={ownedSkinIds}
                    onPick={(skinId) => setCover.mutate({ id: d.id, cover_skin: skinId })}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete notebook "${d.name}"?`)) removeDir.mutate(d.id);
                    }}
                    className="p-1.5 rounded bg-black/40 hover:bg-black/60 backdrop-blur-sm transition"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>

                <div className="px-4 py-3 flex items-center justify-between text-xs text-muted-foreground mono border-t border-border">
                  <span>{folderCount} folder{folderCount === 1 ? "" : "s"}</span>
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => addDir.mutate()}
            className="group rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center justify-center aspect-[4/5] text-muted-foreground hover:text-primary"
          >
            <Plus className="h-10 w-10 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm mono">new notebook</span>
          </button>
        </div>

        {workspace.isLoading && (
          <div className="text-center py-12 text-sm text-muted-foreground mono">loading...</div>
        )}
      </main>
    </div>
  );
}

function CoverPicker({
  currentSkin,
  ownedSkinIds,
  onPick,
}: {
  currentSkin: string;
  ownedSkinIds: Set<string>;
  onPick: (skinId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded bg-black/40 hover:bg-black/60 backdrop-blur-sm transition"
          title="Change cover theme"
        >
          <Palette className="h-3.5 w-3.5 text-white" />
        </button>
      </DialogTrigger>
      <DialogContent
        className="w-[min(92vw,42rem)] max-w-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Cover theme
          </DialogTitle>
          <DialogDescription>
            Choose a cover for this notebook from your available themes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground">
            Available covers
          </div>
          <Link to="/skins" className="text-[10px] mono text-primary hover:underline">
            Get more
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {NOTEBOOK_SKINS.map((s) => {
            const owned = ownedSkinIds.has(s.id);
            const isActive = currentSkin === s.id;
            const bg =
              s.cover ??
              "linear-gradient(135deg, hsl(244 70% 50%), hsl(20 85% 55%) 50%, hsl(150 60% 40%))";
            return (
              <button
                key={s.id}
                disabled={!owned}
                onClick={() => {
                  if (!owned) return;
                  onPick(s.id);
                  setOpen(false);
                }}
                className={`relative aspect-[4/5] rounded-md overflow-hidden border-2 transition ${
                  isActive ? "border-primary" : "border-transparent hover:border-border"
                } ${!owned ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                style={{ background: bg }}
                title={s.name + (owned ? "" : " (locked)")}
              >
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                {!owned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Lock className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
