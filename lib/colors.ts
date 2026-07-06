// Maps plain color names (as produced by the vision tagger) to a hex swatch.
// Names are lowercased and matched loosely so "light blue", "navy blue" etc. resolve.

const NAMED: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f2ea",
  cream: "#efe7d3",
  ivory: "#efe7d3",
  beige: "#d8c7a8",
  tan: "#cdae82",
  khaki: "#b3a06b",
  camel: "#c19a6b",
  brown: "#6f4e37",
  chocolate: "#4a2f22",
  taupe: "#8b7d6b",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  charcoal: "#3a3a3a",
  silver: "#c0c0c0",
  navy: "#20304d",
  blue: "#2f5d9e",
  denim: "#4a6a8a",
  teal: "#2b7a78",
  turquoise: "#3fb6b1",
  green: "#4a7c3f",
  olive: "#6b6b3a",
  sage: "#9caa88",
  mint: "#a8d8c0",
  forest: "#2f4f2f",
  yellow: "#e5c341",
  mustard: "#c9a227",
  gold: "#c9a227",
  orange: "#d97b3c",
  rust: "#b7492c",
  terracotta: "#c8553d",
  red: "#c0392b",
  maroon: "#6e2333",
  burgundy: "#5c1a2b",
  pink: "#e0a0b4",
  blush: "#e8c4c8",
  rose: "#d98a9a",
  coral: "#e5806b",
  purple: "#6b4a8a",
  lavender: "#b8a9d1",
  plum: "#5a3a5a",
  multicolor: "#9aa0a6",
  multi: "#9aa0a6",
};

export function colorToHex(name: string): string {
  const n = name.trim().toLowerCase();
  if (NAMED[n]) return NAMED[n];
  // Loose match: pick the named color whose word appears in the phrase.
  for (const key of Object.keys(NAMED)) {
    if (n.includes(key)) return NAMED[key];
  }
  return "#9aa0a6"; // neutral fallback
}

// Whether a swatch is light enough to need a dark border for contrast.
export function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}
