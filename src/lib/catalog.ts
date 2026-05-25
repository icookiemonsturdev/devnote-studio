// Skin catalog shared between the skins page and the workspace.
export type SkinId =
  | "midnight"
  | "aurora"
  | "sunset"
  | "matrix"
  | "noir"
  | "arctic"
  | "terracotta"
  | "sakura"
  | "ember";

export interface Skin {
  id: SkinId;
  name: string;
  desc: string;
  free: boolean;
  priceId?: string;
  colors: string[];
}

export const SKINS: Skin[] = [
  { id: "midnight", name: "Midnight Indigo", desc: "Deep indigo, default.", free: true, colors: ["#0a0a1a", "#1e1e5a", "#4f46e5"] },
  { id: "aurora", name: "Aurora", desc: "Teal + magenta dream.", free: false, priceId: "skin_aurora_once", colors: ["#0b1a1f", "#2dd4a8", "#e94560"] },
  { id: "sunset", name: "Sunset Blaze", desc: "Warm orange to magenta.", free: false, priceId: "skin_sunset_once", colors: ["#1a0d08", "#ff6b35", "#e84393"] },
  { id: "matrix", name: "Matrix", desc: "Hacker green on black.", free: false, priceId: "skin_matrix_once", colors: ["#08120a", "#22c55e", "#16a34a"] },
  { id: "noir", name: "Noir Gold", desc: "Black with gold accents.", free: false, priceId: "skin_noir_once", colors: ["#0d0d0d", "#1a1a1a", "#c9a84c"] },
  { id: "arctic", name: "Arctic Frost", desc: "Icy blues and silver whites.", free: false, priceId: "skin_arctic_once", colors: ["#e8f0f8", "#6ba3c8", "#2e6b8a"] },
  { id: "terracotta", name: "Terracotta", desc: "Earthy clay and sage.", free: false, priceId: "skin_terracotta_once", colors: ["#c4654a", "#e8a87c", "#87a878"] },
  { id: "sakura", name: "Sakura", desc: "Cherry blossom pinks.", free: false, priceId: "skin_sakura_once", colors: ["#fef0f5", "#f8c8d8", "#e88aab"] },
  { id: "ember", name: "Ember", desc: "Charcoal with warm ember.", free: false, priceId: "skin_ember_once", colors: ["#1a1a1a", "#2d2d2d", "#e85d3a"] },
];

export const ALL_SKINS_PRICE_ID = "skins_pro_monthly";

// Font catalog — Google Fonts loaded in styles.css.
export interface FontOption {
  id: string;
  name: string;
  stack: string;
  category: "sans" | "serif" | "mono" | "display";
}

export const FONTS: FontOption[] = [
  { id: "inter", name: "Inter", stack: "'Inter', ui-sans-serif, system-ui, sans-serif", category: "sans" },
  { id: "space-grotesk", name: "Space Grotesk", stack: "'Space Grotesk', ui-sans-serif, sans-serif", category: "sans" },
  { id: "manrope", name: "Manrope", stack: "'Manrope', ui-sans-serif, sans-serif", category: "sans" },
  { id: "outfit", name: "Outfit", stack: "'Outfit', ui-sans-serif, sans-serif", category: "sans" },
  { id: "dm-sans", name: "DM Sans", stack: "'DM Sans', ui-sans-serif, sans-serif", category: "sans" },
  { id: "playfair", name: "Playfair Display", stack: "'Playfair Display', ui-serif, serif", category: "serif" },
  { id: "lora", name: "Lora", stack: "'Lora', ui-serif, serif", category: "serif" },
  { id: "instrument-serif", name: "Instrument Serif", stack: "'Instrument Serif', ui-serif, serif", category: "serif" },
  { id: "jetbrains-mono", name: "JetBrains Mono", stack: "'JetBrains Mono', ui-monospace, monospace", category: "mono" },
  { id: "ibm-plex-mono", name: "IBM Plex Mono", stack: "'IBM Plex Mono', ui-monospace, monospace", category: "mono" },
  { id: "bebas-neue", name: "Bebas Neue", stack: "'Bebas Neue', ui-sans-serif, sans-serif", category: "display" },
  { id: "abril-fatface", name: "Abril Fatface", stack: "'Abril Fatface', ui-serif, serif", category: "display" },
];

export function getFontStack(id: string | undefined | null): string {
  return FONTS.find((f) => f.id === id)?.stack ?? FONTS[0].stack;
}
