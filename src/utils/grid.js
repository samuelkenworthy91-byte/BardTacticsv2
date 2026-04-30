export function tileColor(type) {
  if (type === "street") return 0x374151;
  if (type === "cover") return 0x475569;
  if (type === "gate") return 0x7c5c3b;
  if (type === "wall") return 0x6b7280;
  if (type === "field") return 0x4d7c0f;
  if (type === "fort") return 0x8b5a2b;
  if (type === "fence") return 0x6b4f2d;
  return 0x1f2937;
}

export function tileLabel(type) {
  if (type === "street") return "S";
  if (type === "cover") return "C";
  if (type === "gate") return "G";
  if (type === "wall") return "W";
  if (type === "field") return "F";
  if (type === "fort") return "FT";
  if (type === "fence") return "FN";
  return "?";
}

export function tileKey(x, y) {
  return `${x},${y}`;
}

export function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
