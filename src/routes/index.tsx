import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { FileCode2, FolderTree, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/home" });
  }, [user, loading, navigate]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-surface)" }} />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full -z-10 opacity-30 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />

      <nav className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-6 w-6 text-primary" />
          <span className="mono font-semibold tracking-tight">dev_notes</span>
        </div>
        <Link
          to="/auth"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90 transition"
        >
          Sign in
        </Link>
      </nav>

      <section className="container mx-auto px-6 pt-20 pb-32 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground mono mb-6">
          <Sparkles className="h-3 w-3 text-primary" />
          built for developers
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Clean and professional
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          Organize your notes the way you organize your projects.
          Create folders, nest directories, and keep everything from quick thoughts to detailed documentation easy to find.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-glow hover:opacity-90 transition"
          >
            Get started — free
          </Link>
          <a
            href="#features"
            className="rounded-md border border-border bg-card px-6 py-3 text-base font-medium hover:bg-secondary transition"
          >
            Learn more
          </a>
        </div>
      </section>

      <section id="features" className="container mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: FolderTree, title: "Hierarchical workspace", body: "Group folders into directories. Your second brain, file-system style." },
          { icon: FileCode2, title: "Markdown editor", body: "Plain text, monospace-friendly, autosaved as you type." },
          { icon: Sparkles, title: "Premium themes", body: "Subscribe monthly to unlock Aurora, Sunset, and Matrix themes." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6">
            <Icon className="h-6 w-6 text-primary mb-4" />
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
