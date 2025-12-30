// utils/getCurrentSystemBounds.ts

export function getCurrentSystemBounds(osmd: any) {
  const container = osmd?.container;
  if (!container) return null;

  const svg = container.querySelector("svg");
  if (!svg) return null;

  // IMPORTANT: read native cursor BEFORE hiding
  const nativeCursor =
    svg.querySelector(".osmd-cursor") as SVGGraphicsElement ||
    svg.querySelector(".cursor") as SVGGraphicsElement;

  if (!nativeCursor) return null;

  const cursorBox = nativeCursor.getBBox();
  const cursorMidY = cursorBox.y + cursorBox.height / 2;

  const connectors = Array.from(
    svg.querySelectorAll(".vf-connector") as NodeListOf<SVGGraphicsElement>
  );

  for (const c of connectors) {
    const box = c.getBBox();
    if (cursorMidY >= box.y && cursorMidY <= box.y + box.height) {
      return {
        x: cursorBox.x,
        y: box.y,
        height: box.height,
      };
    }
  }

  // 🔴 fallback (never invisible)
  return {
    x: cursorBox.x,
    y: cursorBox.y - 40,
    height: 120,
  };
}
