/* eslint-disable @typescript-eslint/no-explicit-any */
export default function highlightGraphicalNoteNative(gn: any, ms = 600) {
    const group = gn?.getSVGGElement?.() || gn?.graphicalNotehead?.svgElement || gn?.svgElement;
    if (!group) return;
    group.classList.add("vf-note-highlight");
    setTimeout(() => group.classList.remove("vf-note-highlight"), ms);
  }