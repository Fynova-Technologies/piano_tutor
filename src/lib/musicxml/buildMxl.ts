import JSZip from "jszip";
import { prepareMusicXmlForOsmd } from "./musicxmlPipeline";

const MXL_MIMETYPE = "application/vnd.recordare.musicxml";

/**
 * Build a standards-compliant compressed MusicXML (.mxl) archive.
 * @see https://www.w3.org/2021/06/musicxml40/tutorial/compressed-mxl-files/
 */
export async function buildMxlBase64(
  musicXml: string,
  entryName = "score.musicxml",
): Promise<{ base64: string; entryName: string }> {
  const normalized = prepareMusicXmlForOsmd(musicXml);
  const safeEntry = entryName.replace(/^\//, "").replace(/\\/g, "/");

  const zip = new JSZip();
  zip.file("mimetype", MXL_MIMETYPE, { compression: "STORE" });

  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0">
  <rootfiles>
    <rootfile full-path="${safeEntry}" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`;

  zip.file("META-INF/container.xml", containerXml, { compression: "DEFLATE" });
  zip.file(safeEntry, normalized, { compression: "DEFLATE" });

  const base64 = await zip.generateAsync({
    type: "base64",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return { base64, entryName: safeEntry };
}

/** Extract MusicXML text from an MXL (zip) buffer with several fallbacks. */
export async function extractMusicXmlFromMxlBuffer(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (containerXml) {
    const match =
      containerXml.match(/full-path=["']([^"']+)["']/i) ??
      containerXml.match(/full-path=([^\s/>]+)/i);
    const rootPath = match?.[1]?.trim();
    if (rootPath) {
      const xmlText = await zip.file(rootPath)?.async("text");
      if (xmlText?.trim()) {
        return prepareMusicXmlForOsmd(xmlText);
      }
    }
  }

  const candidates = Object.keys(zip.files)
    .filter((name) => {
      const f = zip.files[name];
      if (!f || f.dir) return false;
      if (name.startsWith("META-INF/")) return false;
      if (name === "mimetype") return false;
      return /\.(musicxml|xml)$/i.test(name);
    })
    .sort((a, b) => {
      const score = (n: string) =>
        (n.endsWith(".musicxml") ? 0 : 1) + (n.includes("score") ? 0 : 2);
      return score(a) - score(b);
    });

  for (const name of candidates) {
    const xmlText = await zip.file(name)?.async("text");
    if (xmlText?.trim() && /<score-partwise\b/i.test(xmlText)) {
      return prepareMusicXmlForOsmd(xmlText);
    }
  }

  throw new Error(
    candidates.length
      ? "MXL archive has no readable score-partwise document"
      : "container.xml missing from MXL and no .xml/.musicxml entry found",
  );
}

/** Decode base64 MXL payload for browser download. */
export function mxlBase64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: MXL_MIMETYPE });
}

export function triggerMxlDownload(base64: string, fileName: string): void {
  if (typeof document === "undefined") return;
  const blob = mxlBase64ToBlob(base64);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".mxl") ? fileName : `${fileName}.mxl`;
  a.click();
  URL.revokeObjectURL(url);
}
