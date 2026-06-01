import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Check, Lock, Sparkles, X, Crown, BookOpen, ShieldCheck, Zap } from "lucide-react";
import { getWorkspace, updateProfile } from "@/lib/notes.functions";
import { NOTEBOOK_SKINS, ALL_SKINS_PRICE_ID } from "@/lib/catalog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

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
  const activeNotebook: string = profile?.active_notebook_skin ?? "nb_default";

  const [checkoutPrice, setCheckoutPrice] = useState<{ priceId: string; skinId?: string } | null>(null);

  useEffect(() => {
    if (checkout === "success") {
      toast.success("Payment received! Unlocking…");
      const t = setInterval(() => qc.invalidateQueries({ queryKey: ["workspace"] }), 1500);
      setTimeout(() => clearInterval(t), 10000);
    }
  }, [checkout, qc]);

  const setNotebookSkin = useMutation({
    mutationFn: (id: string) => profileFn({ data: { active_notebook_skin: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workspace"] }); toast.success("Default notebook cover updated"); },
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
            <Crown className="h-3 w-3" /> PRO — all covers unlocked
          </span>
        )}
      </header>

      <main className="container mx-auto px-6 py-10 max-w-5xl space-y-12">
        <section className="text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h1 className="text-4xl font-bold mb-3">Notebook Covers</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Buy individual covers for $1.99 each, or subscribe for $5.99/month and unlock every cover — including future releases.
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

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Covers</h2>
            <p className="text-sm text-muted-foreground">Style the notebook covers on your home page. The selected cover here becomes the default for new notebooks.</p>
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
                      {isActive ? "Default" : "Set as default"}
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
        </section>

        <section className="rounded-xl border border-border bg-card/50 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Looking to change editor fonts or vim mode?{" "}
            <Link to="/settings" className="text-primary hover:underline font-medium">
              Open Settings
            </Link>
          </p>
        </section>
      </main>

      {checkoutPrice && (() => {
        const notebookSkin = NOTEBOOK_SKINS.find((s) => s.id === checkoutPrice.skinId);
        const isSubscription = checkoutPrice.priceId === ALL_SKINS_PRICE_ID;
        const itemName = isSubscription ? "PRO — All Covers" : notebookSkin?.name ?? "Premium Cover";
        const itemDesc = isSubscription
          ? "Unlock every notebook cover, plus all future releases."
          : notebookSkin?.desc ?? "";
        const price = isSubscription ? "$5.99/mo" : "$1.99";
        const headerBg = notebookSkin?.cover
          ?? "linear-gradient(135deg, hsl(244 70% 50%), hsl(280 70% 55%))";

        return (
          <div
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setCheckoutPrice(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card border border-border rounded-2xl w-full max-w-md max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            >
              <div className="relative p-6 pb-5" style={{ background: headerBg }}>
                <div className="absolute inset-0 bg-black/20" />
                <button
                  onClick={() => setCheckoutPrice(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition z-10"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] mono uppercase tracking-widest text-white/80 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                      {isSubscription ? "Subscription" : "Notebook Cover"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-sm">{itemName}</h2>
                  <p className="text-sm text-white/85 drop-shadow-sm">{itemDesc}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white drop-shadow-sm">{price}</span>
                    {!isSubscription && <span className="text-xs text-white/70 mono">one-time</span>}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between text-[11px] mono text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure checkout</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Instant unlock</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <StripeEmbeddedCheckout
                  priceId={checkoutPrice.priceId}
                  skinId={checkoutPrice.skinId}
                  returnUrl={`${window.location.origin}/skins?checkout=success&session_id={CHECKOUT_SESSION_ID}`}
                  theme={{ backgroundColor: "#0a0a1a", buttonColor: "#4f46e5" }}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
