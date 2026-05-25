import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileCode2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/app" });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-surface)" }} />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <FileCode2 className="h-6 w-6 text-primary" />
          <span className="mono font-semibold">dev_notes</span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-8 shadow-glow">
          <h1 className="text-2xl font-bold mb-1">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signin" ? "Sign in to your notes." : "Start organizing your code notes."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.99h5.27c-.23 1.4-1.6 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.93 3.97 14.83 3 12.18 3 6.97 3 2.78 7.22 2.78 12.43c0 5.2 4.19 9.43 9.4 9.43 5.43 0 9.03-3.81 9.03-9.18 0-.62-.07-1.09-.16-1.58z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground mono">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md bg-input border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={80}
              />
            )}
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-input border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={255}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-input border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              minLength={6}
              maxLength={72}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "No account?" : "Already have one?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
