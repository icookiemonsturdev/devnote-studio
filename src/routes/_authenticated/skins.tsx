import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Check, Lock, Sparkles, X, Crown, BookOpen, Palette, ShieldCheck, Zap } from "lucide-react";
import { getWorkspace, updateProfile } from "@/lib/notes.functions";
import { SKINS, NOTEBOOK_SKINS, ALL_SKINS_PRICE_ID, FONTS, NOTEBOOK_SKINS as NB, type SkinId, type Skin, type NotebookSkin } from "@/lib/catalog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/skins")({
  component: SkinsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: typeof s.checkout === "string" ? s.checkout : undefined,
  }),
});

function SkinsPage() {
  const qc = useQueryClient();
  const wsFn = useServerFn(getWorkspace);
  const profileFn = useServerFn(updateProfile);
  const { checkout } = Route.useSearch();

  const ws = useQuery({ queryKey: ["workspace"], queryFn: () => wsFn() });
  const subscribed: boolean = ws.data?.subscriptionActive ?? false;
  const purchased: string[] = ws.data?.purchasedSkins ?? [];
  const profile: any = ws.data?.profile;
  const active = (profile?.active_skin as SkinId) ?? "midnight";
  const activeNotebook: string = profile?.active_notebook_skin ?? "nb_default";
  const headingFont: string = profile?.heading_font ?? "inter";
  const bodyFont: string = profile?.body_font ?? "inter";

  const [checkoutPrice, setCheckoutPrice] = useState<{ priceId: string; skinId?: string } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-skin", active);
    const h = FONTS.find((f) => f.id === headingFont)?.stack;
    const b = FONTS.find((f) => f.id === bodyFont)?.stack;
    if (h) document.documentElement.style.setProperty("--font-heading", h);
    if (b) document.documentElement.style.setProperty("--font-body", b);
  }, [active, headingFont, bodyFont]);

  useEffect(() => {
    if (checkout === "success") {
      toast.success("Payment received! Unlocking…");
      const t = setInterval(() => qc.invalidateQueries({ queryKey: ["workspace"] }), 1500);
      setTimeout(() => clearInterval(t), 10000);
    }
  }, [checkout, qc]);

  const setSkin = useMutation({
    mutationFn: (id: string) => profileFn({ data: { active_skin: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Editor skin applied"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const setNotebookSkin = useMutation({
    mutationFn: (id: string) => profileFn({ data: { active_notebook_skin: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Notebook skin applied"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const setFont = useMutation({
    mutationFn: (data: { heading_font?: string; body_font?: string }) => profileFn({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Font updated"); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-surface)" }}>
      <PaymentTestModeBanner />
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to notebooks
        </Link>
        {subscribed && (
          <span className="rounded-full bg-primary/15 text-primary mono text-xs px-3 py-1 border border-primary/30 flex items-center gap-1.5">
            <Crown className="h-3 w-3" /> PRO — all skins unlocked
          </span>
        )}
      </header>

      <main className="container mx-auto px-6 py-10 max-w-5xl space-y-12">
        <section className="text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h1 className="text-4xl font-bold mb-3">Premium Skins</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Buy individual skins for $1.99 each, or subscribe for $5.99/month and unlock every skin — including future releases.
          </p>
          {!subscribed && (
            <button
              onClick={() => setCheckoutPrice({ priceId: ALL_SKINS_PRICE_ID })}
              className="mt-6 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 inline-flex items-center gap-2"
            >
              <Crown className="h-4 w-4" /> Subscribe — $5.99 / month
            </button>
          )}
        </section>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Editor Skins
            </TabsTrigger>
            <TabsTrigger value="notebook" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Notebook Skins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Editor Skins</h2>
              <p className="text-sm text-muted-foreground">Theme the note editor and sidebar.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SKINS.map((s) => {
                const owned = s.free || subscribed || purchased.includes(s.id);
                const isActive = active === s.id;
                return (
                  <div
                    key={s.id}
                    className={`relative rounded-xl border p-5 transition ${
                      isActive ? "border-primary shadow-glow" : "border-border"
                    } bg-card`}
                  >
                    <div className="flex gap-1.5 mb-4">
                      {s.colors.map((c, i) => (
                        <div key={i} className="h-10 flex-1 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold">{s.name}</h3>
                      {s.free ? (
                        <span className="text-[10px] mono text-muted-foreground">FREE</span>
                      ) : owned ? (
                        <span className="text-[10px] mono text-primary">OWNED</span>
                      ) : (
                        <span className="text-[10px] mono text-muted-foreground">$1.99</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                    {owned ? (
                      <button
                        disabled={isActive || setSkin.isPending}
                        onClick={() => setSkin.mutate(s.id)}
                        className="w-full rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                        {isActive ? "Active" : "Apply"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCheckoutPrice({ priceId: s.priceId!, skinId: s.id })}
                        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition flex items-center justify-center gap-2"
                      >
                        <Lock className="h-3.5 w-3.5" /> Unlock $1.99
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="notebook">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Notebook Skins</h2>
              <p className="text-sm text-muted-foreground">Style the notebook covers on your home page.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {NOTEBOOK_SKINS.map((s) => {
                const owned = s.free || subscribed || purchased.includes(s.id);
                const isActive = activeNotebook === s.id;
                return (
                  <div
                    key={s.id}
                    className={`relative rounded-xl border p-5 transition ${
                      isActive ? "border-primary shadow-glow" : "border-border"
                    } bg-card`}
                  >
                    {/* Notebook cover preview */}
                    <div
                      className="aspect-[4/5] rounded-md mb-4 p-4 flex flex-col justify-between relative overflow-hidden"
                      style={{
                        background:
                          s.cover ??
                          "linear-gradient(135deg, hsl(244 70% 50%), hsl(20 85% 55%) 50%, hsl(150 60% 40%))",
                      }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20" />
                      <BookOpen className="h-5 w-5 text-white/90" />
                      <div>
                        <div className="text-[10px] mono text-white/70 mb-0.5">NOTEBOOK</div>
                        <div className="text-sm font-semibold text-white">{s.name}</div>
                      </div>
                    </div>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold">{s.name}</h3>
                      {s.free ? (
                        <span className="text-[10px] mono text-muted-foreground">FREE</span>
                      ) : owned ? (
                        <span className="text-[10px] mono text-primary">OWNED</span>
                      ) : (
                        <span className="text-[10px] mono text-muted-foreground">$1.99</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                    {owned ? (
                      <button
                        disabled={isActive || setNotebookSkin.isPending}
                        onClick={() => setNotebookSkin.mutate(s.id)}
                        className="w-full rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                        {isActive ? "Active" : "Apply"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCheckoutPrice({ priceId: s.priceId!, skinId: s.id })}
                        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition flex items-center justify-center gap-2"
                      >
                        <Lock className="h-3.5 w-3.5" /> Unlock $1.99
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mono uppercase tracking-wider mb-4">Typography</h2>
          <p className="text-sm text-muted-foreground mb-6">Free for everyone — pick a heading and body font for your workspace.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <FontPicker
              label="Heading font"
              selected={headingFont}
              onSelect={(id) => setFont.mutate({ heading_font: id })}
              sample="The quick brown fox"
              isHeading
            />
            <FontPicker
              label="Body font"
              selected={bodyFont}
              onSelect={(id) => setFont.mutate({ body_font: id })}
              sample="The quick brown fox jumps over the lazy dog."
            />
          </div>
        </section>
      </main>

      {checkoutPrice && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCheckoutPrice(null)}
              className="absolute top-3 right-3 p-1.5 rounded hover:bg-muted text-muted-foreground z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-2">
              <StripeEmbeddedCheckout
                priceId={checkoutPrice.priceId}
                skinId={checkoutPrice.skinId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FontPicker({
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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs mono uppercase tracking-wider text-muted-foreground mb-3">{label}</div>
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {FONTS.map((f) => {
          const active = selected === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md border transition flex items-center justify-between gap-3 ${
                active
                  ? "border-primary bg-primary/10"
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
