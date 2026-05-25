import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BookOpen, Plus, Settings, Sparkles, LogOut, FileCode2, Trash2,
} from "lucide-react";
import { getWorkspace, createDirectory, deleteDirectory } from "@/lib/notes.functions";
import { getFontStack } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function HomePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const wsFn = useServerFn(getWorkspace);
  const newDirFn = useServerFn(createDirectory);
  const delDirFn = useServerFn(deleteDirectory);

  const workspace = useQuery({ queryKey: ["workspace"], queryFn: () => wsFn() });

  useEffect(() => {
    const skin = workspace.data?.profile?.active_skin ?? "midnight";
    document.documentElement.setAttribute("data-skin", skin);
    document.documentElement.style.setProperty("--font-heading", getFontStack(workspace.data?.profile?.heading_font));
    document.documentElement.style.setProperty("--font-body", getFontStack(workspace.data?.profile?.body_font));
  }, [workspace.data?.profile?.active_skin, workspace.data?.profile?.heading_font, workspace.data?.profile?.body_font]);

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

  const ws = workspace.data;
  const dirs = ws?.directories ?? [];
  const folders = ws?.folders ?? [];
  const isSubscribed = ws?.subscriptionActive ?? false;

  // Cycle through accent hues for visual variety on notebook covers
  const covers = [
    "linear-gradient(135deg, hsl(244 70% 50%), hsl(280 70% 55%))",
    "linear-gradient(135deg, hsl(200 80% 45%), hsl(180 70% 50%))",
    "linear-gradient(135deg, hsl(20 85% 55%), hsl(340 75% 55%))",
    "linear-gradient(135deg, hsl(150 60% 40%), hsl(180 65% 45%))",
    "linear-gradient(135deg, hsl(45 90% 55%), hsl(20 85% 55%))",
    "linear-gradient(135deg, hsl(280 65% 55%), hsl(320 70% 55%))",
    "linear-gradient(135deg, hsl(220 70% 45%), hsl(260 65% 55%))",
    "linear-gradient(135deg, hsl(160 60% 40%), hsl(220 70% 50%))",
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-surface)" }}>
      {/* Top bar */}
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-primary" />
            <span className="mono text-sm font-semibold">dev_notes</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/skins" className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm hover:bg-muted transition">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Skins</span>
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
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Your notebooks
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
            {dirs.length === 0
              ? "Create your first notebook to get started."
              : `${dirs.length} notebook${dirs.length === 1 ? "" : "s"} · ${folders.length} folder${folders.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dirs.map((d, i) => {
            const folderCount = folders.filter((f) => f.directory_id === d.id).length;
            return (
              <button
                key={d.id}
                onClick={() => navigate({ to: "/app", search: { dir: d.id } })}
                className="group relative text-left rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 hover:shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-1"
              >
                {/* Notebook cover */}
                <div
                  className="aspect-[4/5] p-5 flex flex-col justify-between relative"
                  style={{ background: covers[i % covers.length] }}
                >
                  {/* Spine */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/20" />
                  <div className="flex items-start justify-between">
                    <BookOpen className="h-6 w-6 text-white/90" />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete notebook "${d.name}"?`)) removeDir.mutate(d.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-black/30 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </span>
                  </div>
                  <div>
                    <div className="text-xs mono text-white/70 mb-1">NOTEBOOK</div>
                    <div className="text-lg font-semibold text-white line-clamp-2" style={{ fontFamily: "var(--font-heading)" }}>
                      {d.name}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between text-xs text-muted-foreground mono border-t border-border">
                  <span>{folderCount} folder{folderCount === 1 ? "" : "s"}</span>
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            );
          })}

          {/* Add notebook card */}
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
