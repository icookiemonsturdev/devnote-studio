import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, User, Type } from "lucide-react";
import { getWorkspace, updateProfile } from "@/lib/notes.functions";
import { FONTS } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const wsFn = useServerFn(getWorkspace);
  const profileFn = useServerFn(updateProfile);

  const ws = useQuery({ queryKey: ["workspace"], queryFn: () => wsFn() });
  const profile = ws.data?.profile;

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => profileFn({ data: { display_name: displayName, avatar_url: avatarUrl || "" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Profile saved"); },
    onError: (e) => toast.error(e.message),
  });

  const setFont = useMutation({
    mutationFn: (data: { heading_font?: string; body_font?: string }) => profileFn({ data }),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["workspace"] });
      const previous = qc.getQueryData(["workspace"]);
      qc.setQueryData<any>(["workspace"], (prev: any) =>
        prev?.profile ? { ...prev, profile: { ...prev.profile, ...data } } : prev,
      );
      return { previous };
    },
    onSuccess: () => toast.success("Editor font updated"),
    onError: (e, _d, ctx) => {
      if (ctx?.previous) qc.setQueryData(["workspace"], ctx.previous);
      toast.error((e as Error).message);
    },
  });

  const headingFont: string = (profile as any)?.heading_font ?? "inter";
  const bodyFont: string = (profile as any)?.body_font ?? "inter";

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-surface)" }}>
      <header className="container mx-auto px-6 py-6">
        <Link to="/home" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all hover:-translate-x-1">
          <ArrowLeft className="h-4 w-4" /> Back to notebooks
        </Link>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-xl animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <section className="rounded-xl border border-border bg-card p-6 mb-6 transition-all hover:shadow-glow">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border transition-transform hover:scale-105">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-semibold">{displayName || "Anonymous"}</div>
              <div className="text-sm text-muted-foreground mono">{user?.email}</div>
            </div>
          </div>

          <label className="block text-sm font-medium mb-1">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            className="w-full mb-4 rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />

          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            maxLength={500}
            className="w-full mb-4 rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
          >
            {save.isPending ? "Saving..." : "Save changes"}
          </button>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 mb-6 transition-all hover:shadow-glow animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Type className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Editor Typography</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Choose the fonts used inside the note editor.
          </p>

          <div className="grid grid-cols-1 gap-5">
            <FontGrid
              label="Heading font"
              selected={headingFont}
              onSelect={(id) => setFont.mutate({ heading_font: id })}
              sample="The quick brown fox"
              isHeading
            />
            <FontGrid
              label="Body font"
              selected={bodyFont}
              onSelect={(id) => setFont.mutate({ body_font: id })}
              sample="The quick brown fox jumps over the lazy dog."
            />
          </div>
        </section>

        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-muted-foreground hover:text-destructive transition-all hover:translate-x-1"
        >
          Sign out
        </button>
      </main>
    </div>
  );
}

function FontGrid({
  label,
  selected,
  onSelect,
  sample,
  isHeading,
}: {
  label: string;
  selected: string;
  onSelect: (id: string) => void;
  sample: string;
  isHeading?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] mono uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {FONTS.map((f) => {
          const active = selected === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md border transition-all flex items-center justify-between gap-3 active:scale-[0.98] hover:-translate-y-0.5 ${
                active
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              }`}
            >
              <span
                className={isHeading ? "text-lg" : "text-sm"}
                style={{ fontFamily: f.stack }}
              >
                {sample}
              </span>
              <span className="text-[10px] mono text-muted-foreground shrink-0">{f.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
