import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Check, Lock, Sparkles } from "lucide-react";
import { getWorkspace, updateProfile } from "@/lib/notes.functions";

export const Route = createFileRoute("/_authenticated/skins")({
  component: SkinsPage,
});

const SKINS = [
  { id: "midnight", name: "Midnight Indigo", desc: "Deep indigo, default.", free: true, colors: ["#0a0a1a", "#1e1e5a", "#4f46e5"] },
  { id: "aurora", name: "Aurora", desc: "Teal + magenta dream.", free: false, colors: ["#0b1a1f", "#2dd4a8", "#e94560"] },
  { id: "sunset", name: "Sunset Blaze", desc: "Warm orange to magenta.", free: false, colors: ["#1a0d08", "#ff6b35", "#e84393"] },
  { id: "matrix", name: "Matrix", desc: "Hacker green on black.", free: false, colors: ["#08120a", "#22c55e", "#16a34a"] },
] as const;

function SkinsPage() {
  const qc = useQueryClient();
  const wsFn = useServerFn(getWorkspace);
  const profileFn = useServerFn(updateProfile);

  const ws = useQuery({ queryKey: ["workspace"], queryFn: () => wsFn() });
  const subscribed = ws.data?.subscriber?.subscribed ?? false;
  const active = ws.data?.profile?.active_skin ?? "midnight";

  useEffect(() => {
    document.documentElement.setAttribute("data-skin", active);
  }, [active]);

  const setSkin = useMutation({
    mutationFn: (id: string) => profileFn({ data: { active_skin: id as "midnight" | "aurora" | "sunset" | "matrix" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Skin applied"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-surface)" }}>
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to notes
        </Link>
        {subscribed && (
          <span className="rounded-full bg-primary/15 text-primary mono text-xs px-3 py-1 border border-primary/30">
            PRO active
          </span>
        )}
      </header>

      <main className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="text-center mb-12">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h1 className="text-4xl font-bold mb-3">Premium Skins</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Customize your workspace. Subscribe monthly to unlock all premium themes.
          </p>
          {!subscribed && (
            <button
              onClick={() => toast.info("Stripe checkout coming online soon. The skins UI is ready.")}
              className="mt-6 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90"
            >
              Subscribe — $4.99 / month
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {SKINS.map((s) => {
            const locked = !s.free && !subscribed;
            const isActive = active === s.id;
            return (
              <div
                key={s.id}
                className={`relative rounded-xl border p-6 transition ${
                  isActive ? "border-primary shadow-glow" : "border-border"
                } bg-card`}
              >
                <div className="flex gap-1.5 mb-4">
                  {s.colors.map((c) => (
                    <div key={c} className="h-10 flex-1 rounded" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold">{s.name}</h3>
                  {s.free ? (
                    <span className="text-[10px] mono text-muted-foreground">FREE</span>
                  ) : (
                    <span className="text-[10px] mono text-primary">PRO</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                <button
                  disabled={locked || isActive || setSkin.isPending}
                  onClick={() => setSkin.mutate(s.id)}
                  className="w-full rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {locked && <Lock className="h-3.5 w-3.5" />}
                  {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                  {isActive ? "Active" : locked ? "Locked" : "Apply"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
