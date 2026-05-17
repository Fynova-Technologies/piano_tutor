import JSZip from "jszip";

const MXL_MIMETYPE = "application/vnd.recordare.musicxml";

/**
 * Build a standards-compliant compressed MusicXML (.mxl) archive.
 * @see https://www.w3.org/2021/06/musicxml40/tutorial/compressed-mxl-files/
 */
export async function buildMxlBase64(
  musicXml: string,
  entryName = "score.musicxml",
): Promise<{ base64: string; entryName: string }> {
  const zip = new JSZip();

  // Must be first entry in the archive, stored without compression.
  zip.file("mimetype", MXL_MIMETYPE, { compression: "STORE" });

  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0">
  <rootfiles>
    <rootfile full-path="${entryName}" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`;

  zip.file("META-INF/container.xml", containerXml, { compression: "DEFLATE" });
  zip.file(entryName, musicXml, { compression: "DEFLATE" });

  const base64 = await zip.generateAsync({
    type: "base64",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return { base64, entryName };
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
