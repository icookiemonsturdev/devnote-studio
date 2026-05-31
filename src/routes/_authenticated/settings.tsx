import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, User } from "lucide-react";
import { getWorkspace, updateProfile } from "@/lib/notes.functions";
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
      document.documentElement.setAttribute("data-skin", profile.active_skin ?? "midnight");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => profileFn({ data: { display_name: displayName, avatar_url: avatarUrl || "" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Profile saved"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-surface)" }}>
      <header className="container mx-auto px-6 py-6">
        <Link to="/home" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to notebooks
        </Link>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <section className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
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
            className="w-full mb-4 rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            maxLength={500}
            className="w-full mb-4 rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {save.isPending ? "Saving..." : "Save changes"}
          </button>
        </section>

        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-muted-foreground hover:text-destructive"
        >
          Sign out
        </button>
      </main>
    </div>
  );
}
