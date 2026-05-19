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
// src/lib/musicxml/buildMxl.ts — replace extractMusicXmlFromMxlBuffer


export async function extractMusicXmlFromMxlBuffer(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Check META-INF/container.xml for the rootfile path (proper MXL spec)
  const containerFile = zip.file("META-INF/container.xml");
  if (containerFile) {
    const containerText = await containerFile.async("text");
    const match = containerText.match(/full-path="([^"]+)"/);
    if (match?.[1]) {
      const rootFile = zip.file(match[1]);
      if (rootFile) {
        const xml = await rootFile.async("text");
        if (xml.includes("score-partwise")) {
          console.log("✅ MXL: found rootfile via container.xml →", match[1]);
          return xml;
        }
      }
    }
  }

  // 2. Fallback: scan all files for one containing score-partwise
  const candidates: string[] = [];
  zip.forEach((relativePath) => {
    const lower = relativePath.toLowerCase();
    if (
      (lower.endsWith(".xml") || lower.endsWith(".musicxml")) &&
      !lower.startsWith("__macosx") // skip Mac metadata
    ) {
      candidates.push(relativePath);
    }
  });

  for (const path of candidates) {
    const file = zip.file(path);
    if (!file) continue;
    const xml = await file.async("text");
    if (xml.includes("score-partwise")) {
      console.log("✅ MXL: found score-partwise in →", path);
      return xml;
    }
  }

  // 3. Last resort: any file with score-partwise regardless of extension
  const allFiles: string[] = [];
  zip.forEach((p) => allFiles.push(p));
  for (const path of allFiles) {
    if (path.toLowerCase().startsWith("__macosx")) continue;
    const file = zip.file(path);
    if (!file) continue;
    try {
      const xml = await file.async("text");
      if (xml.includes("score-partwise")) {
        console.log("✅ MXL: last-resort found score-partwise in →", path);
        return xml;
      }
    } catch {
      // binary file, skip
    }
  }

  throw new Error("No score-partwise element found in any file inside the MXL archive");
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
