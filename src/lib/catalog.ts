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
  { id: "aurora", name: "Aurora", desc: "Teal + magenta dream.", free: true, colors: ["#0b1a1f", "#2dd4a8", "#e94560"] },
  { id: "sunset", name: "Sunset Blaze", desc: "Warm orange to magenta.", free: false, priceId: "skin_sunset_199", colors: ["#1a0d08", "#ff6b35", "#e84393"] },
  { id: "matrix", name: "Matrix", desc: "Hacker green on black.", free: false, priceId: "skin_matrix_199", colors: ["#08120a", "#22c55e", "#16a34a"] },
  { id: "noir", name: "Noir Gold", desc: "Black with gold accents.", free: false, priceId: "skin_noir_199", colors: ["#0d0d0d", "#1a1a1a", "#c9a84c"] },
  { id: "arctic", name: "Arctic Frost", desc: "Icy blues and silver whites.", free: false, priceId: "skin_arctic_199", colors: ["#e8f0f8", "#6ba3c8", "#2e6b8a"] },
  { id: "terracotta", name: "Terracotta", desc: "Earthy clay and sage.", free: false, priceId: "skin_terracotta_199", colors: ["#c4654a", "#e8a87c", "#87a878"] },
  { id: "sakura", name: "Sakura", desc: "Cherry blossom pinks.", free: false, priceId: "skin_sakura_199", colors: ["#fef0f5", "#f8c8d8", "#e88aab"] },
  { id: "ember", name: "Ember", desc: "Charcoal with warm ember.", free: false, priceId: "skin_ember_199", colors: ["#1a1a1a", "#2d2d2d", "#e85d3a"] },
];

export const ALL_SKINS_PRICE_ID = "skins_pro_monthly";

// Notebook skins — applied to notebook covers on the home page.
export interface NotebookSkin {
  id: string;
  name: string;
  desc: string;
  free: boolean;
  priceId?: string;
  // CSS background for the cover. When null, the home page uses its default rotating gradients.
  cover: string | null;
  // Swatch colors for previews.
  swatch: string[];
}

export const NOTEBOOK_SKINS: NotebookSkin[] = [
  {
    id: "nb_default",
    name: "Classic Rainbow",
    desc: "Default rotating gradient covers.",
    free: true,
    cover: null,
    swatch: ["hsl(244 70% 50%)", "hsl(200 80% 45%)", "hsl(20 85% 55%)", "hsl(150 60% 40%)"],
  },
  {
    id: "nb_galaxy",
    name: "Galaxy",
    desc: "Deep purple to electric blue.",
    free: true,
    cover: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #7c3aed 100%)",
    swatch: ["#1e1b4b", "#4338ca", "#7c3aed"],
  },
  {
    id: "nb_ocean",
    name: "Ocean",
    desc: "Cool teal to deep blue.",
    free: false,
    priceId: "nb_ocean_199",
    cover: "linear-gradient(135deg, #0c4a6e 0%, #0891b2 60%, #22d3ee 100%)",
    swatch: ["#0c4a6e", "#0891b2", "#22d3ee"],
  },
  {
    id: "nb_sunset",
    name: "Sunset",
    desc: "Warm orange to pink.",
    free: false,
    priceId: "nb_sunset_199",
    cover: "linear-gradient(135deg, #b45309 0%, #ea580c 50%, #db2777 100%)",
    swatch: ["#b45309", "#ea580c", "#db2777"],
  },
  {
    id: "nb_forest",
    name: "Forest",
    desc: "Rich greens, calm and grounded.",
    free: false,
    priceId: "nb_forest_199",
    cover: "linear-gradient(135deg, #14532d 0%, #16a34a 60%, #84cc16 100%)",
    swatch: ["#14532d", "#16a34a", "#84cc16"],
  },
  {
    id: "nb_gold",
    name: "Gold Leather",
    desc: "Black leather with gold accents.",
    free: false,
    priceId: "nb_gold_199",
    cover: "linear-gradient(135deg, #1c1917 0%, #292524 60%, #c9a84c 100%)",
    swatch: ["#1c1917", "#292524", "#c9a84c"],
  },
  {
    id: "nb_blush",
    name: "Blush",
    desc: "Soft pink and lavender.",
    free: false,
    priceId: "nb_blush_199",
    cover: "linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #c084fc 100%)",
    swatch: ["#fce7f3", "#f9a8d4", "#c084fc"],
  },
  {
    id: "nb_carbon",
    name: "Carbon",
    desc: "Sleek dark carbon fiber.",
    free: false,
    priceId: "nb_carbon_199",
    cover: "linear-gradient(135deg, #0a0a0a 0%, #262626 50%, #404040 100%)",
    swatch: ["#0a0a0a", "#262626", "#404040"],
  },
  {
    id: "nb_kraft",
    name: "Kraft Paper",
    desc: "Warm kraft paper texture.",
    free: false,
    priceId: "nb_kraft_199",
    cover: "linear-gradient(135deg, #92400e 0%, #c2855b 50%, #e7d3b0 100%)",
    swatch: ["#92400e", "#c2855b", "#e7d3b0"],
  },
];


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
