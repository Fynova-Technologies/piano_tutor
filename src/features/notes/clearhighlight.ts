/* eslint-disable @typescript-eslint/no-explicit-any */
export default function clearHighlight(osmd: any) {
    if (!osmd?.GraphicSheet?.MeasureList) return;
    const measureList = osmd.GraphicSheet.MeasureList;

    for (const system of measureList) {
      if (!Array.isArray(system)) continue;
      for (const gMeasure of system) {
        if (!gMeasure?.staffEntries) continue;
        for (const entry of gMeasure.staffEntries) {
          const gNotes = entry.graphicalNotes || [];
          for (const gn of gNotes) {
            try {
              if (gn.sourceNote && gn.sourceNote.noteheadColor) gn.sourceNote.noteheadColor = undefined;
            } catch {}
          }
        }
      }
    }

    try {
      osmd.render();
    } catch (e) {
      console.warn("osmd.render failed when clearing highlights:", e);
    }
  }