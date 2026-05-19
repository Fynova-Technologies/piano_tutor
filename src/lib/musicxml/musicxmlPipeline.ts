export const XML_DECLARATION_EXACT = '<?xml version="1.0" encoding="UTF-8"?>';

export function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, "").trim();
}

/** Decode common XML entities when the model returns escaped markup. */
export function decodeXmlEntities(text: string): string {
  let t = text;
  if (!/&lt;|&gt;|&amp;#/.test(t)) return t;
  for (let i = 0; i < 3; i++) {
    const next = t
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    if (next === t) break;
    t = next;
  }
  return t;
}

export function stripMarkdownFences(raw: string): string {
  let t = raw;
  for (let i = 0; i < 8; i++) {
    const next = t
      .replace(/^```(?:xml|musicxml)?\s*/gim, "")
      .replace(/\s*```$/gim, "")
      .replace(/```(?:xml|musicxml)?/gi, "");
    if (next === t) break;
    t = next;
  }
  return t.trim();
}

export function extractXmlFromPossibleJson(text: string): string {
  const t = stripBom(text);
  if (!t.startsWith("{") && !t.startsWith("[")) return text;
  try {
    const parsed = JSON.parse(t) as unknown;
    if (typeof parsed !== "object" || parsed === null) return text;
    const o = parsed as Record<string, unknown>;
    for (const k of [
      "musicXml",
      "musicxml",
      "xml",
      "score",
      "content",
      "data",
      "music_xml",
    ]) {
      const v = o[k];
      if (typeof v === "string" && /<\s*(score-partwise|score-timewise|part-list|part)\b/i.test(v)) {
        return v;
      }
    }
  } catch {
    /* not JSON */
  }
  return text;
}

function sliceBetweenRootTags(text: string, rootName: string): string | null {
  const t = stripMarkdownFences(decodeXmlEntities(extractXmlFromPossibleJson(text)));
  const openRe = new RegExp(`<${rootName}\\b`, "i");
  const closeTag = `</${rootName}>`;
  const openIdx = t.search(openRe);
  if (openIdx < 0) return null;

  let slice = t.slice(openIdx);
  const closeIdx = slice.lastIndexOf(closeTag);
  if (closeIdx >= 0) {
    slice = slice.slice(0, closeIdx + closeTag.length);
  }
  return openRe.test(slice) ? slice.trim() : null;
}

export function sliceScorePartwiseDocument(text: string): string | null {
  return (
    sliceBetweenRootTags(text, "score-partwise") ??
    sliceBetweenRootTags(text, "score-timewise")
  );
}

export function extractLooseXmlPayload(text: string): string {
  const t = stripMarkdownFences(decodeXmlEntities(extractXmlFromPossibleJson(text)));
  const i = t.search(
    /<\?xml|<score-partwise\b|<score-timewise\b|<score\b|<musicxml\b|<music-score\b|<part-list\b|<part\b/i,
  );
  return (i >= 0 ? t.slice(i) : t).trim();
}

/** Best-effort pull of MusicXML from raw model text. */
export function extractMusicXmlFromModelText(raw: string): string | null {
  const steps = [
    () => sliceScorePartwiseDocument(raw),
    () => extractLooseXmlPayload(raw),
    () => {
      const t = decodeXmlEntities(stripMarkdownFences(raw));
      const m = t.match(/<score-partwise[\s\S]*/i);
      return m?.[0]?.trim() ?? null;
    },
    () => {
      const t = decodeXmlEntities(stripMarkdownFences(raw));
      const m = t.match(/<part-list[\s\S]*/i);
      return m?.[0]?.trim() ?? null;
    },
  ];
  for (const fn of steps) {
    const doc = fn();
    if (doc && doc.length >= 40) return doc;
  }
  return null;
}

export function ensureXmlDeclaration(doc: string): string {
  const t = stripBom(doc);
  if (/^\s*<\?xml\b/i.test(t)) return t;
  return `${XML_DECLARATION_EXACT}\n${t}`;
}

function buildMinimalPartList(): string {
  return `<part-list><score-part id="P1" name="Piano"><score-instrument id="P1-I1"><instrument-name>Piano</instrument-name></score-instrument></score-part></part-list>`;
}

function buildMinimalPart(): string {
  return `<part id="P1">
  <measure number="1">
    <attributes>
      <divisions>1</divisions>
      <key><fifths>0</fifths></key>
      <time><beats>4</beats><beat-type>4</beat-type></time>
      <clef><sign>G</sign><line>2</line></clef>
    </attributes>
    <note><rest/><duration>4</duration><type>whole</type></note>
  </measure>
</part>`;
}

function buildMinimalScore(): string {
  return `${XML_DECLARATION_EXACT}\n<score-partwise version="3.1">\n${buildMinimalPartList()}\n${buildMinimalPart()}\n</score-partwise>`;
}

/**
 * Guarantee a score-partwise document — never leave bare fragments for validation.
 */
export function ensureScorePartwiseRoot(doc: string): string {
  let out = stripBom(decodeXmlEntities(doc)).trim();

  if (/<score-partwise(?:\s|>)/i.test(out)) {
    const { open, close } = countScorePartwiseTags(out);
    if (open === 1 && close === 1) return out;
    return collapseScorePartwiseRoot(out);
  }

  if (/<score-timewise\b/i.test(out)) {
    out = out
      .replace(/<score-timewise\b([^>]*)>/i, '<score-partwise version="3.1">')
      .replace(/<\/score-timewise>/gi, "</score-partwise>");
    if (/<score-partwise\b/i.test(out)) return out;
  }

  // Legacy <score> wrapper (must not match score-part or score-partwise)
  if (/<score\s[^>]*>/i.test(out) || /^<score>/i.test(out)) {
    out = out
      .replace(/<score\s[^>]*>/i, '<score-partwise version="3.1">')
      .replace(/<score>/i, '<score-partwise version="3.1">')
      .replace(/<\/score>/gi, "</score-partwise>");
    if (/<score-partwise\b/i.test(out)) return out;
  }

  if (/<musicxml\b/i.test(out) || /<music-score\b/i.test(out)) {
    out = out
      .replace(/<(musicxml|music-score)\b([^>]*)>/gi, '<score-partwise version="3.1">')
      .replace(/<\/(musicxml|music-score)>/gi, "</score-partwise>");
    if (/<score-partwise\b/i.test(out)) return out;
  }

  const withoutDecl = out.replace(/^<\?xml[^?]*\?>\s*/i, "").trim();

  if (/<part-list\b/i.test(withoutDecl) || /<part\s+[^>]*\bid\s*=/i.test(withoutDecl)) {
    return `${XML_DECLARATION_EXACT}\n<score-partwise version="3.1">\n${withoutDecl}\n</score-partwise>`;
  }

  if (/<measure\b/i.test(withoutDecl)) {
    return `${XML_DECLARATION_EXACT}\n<score-partwise version="3.1">\n${buildMinimalPartList()}\n<part id="P1">\n${withoutDecl}\n</part>\n</score-partwise>`;
  }

  if (withoutDecl.length > 60 && /<(note|pitch|rest)\b/i.test(withoutDecl)) {
    return `${XML_DECLARATION_EXACT}\n<score-partwise version="3.1">\n${buildMinimalPartList()}\n<part id="P1">\n<measure number="1">\n${withoutDecl}\n</measure>\n</part>\n</score-partwise>`;
  }

  console.warn("[XML repair] No recognizable MusicXML root — using minimal score");
  return buildMinimalScore();
}

function stripPrologNoise(doc: string): string {
  let t = stripBom(doc);
  const declMatch = t.match(/^<\?xml[^?]*\?>\s*/i);
  const decl = declMatch?.[0] ?? "";
  let rest = declMatch ? t.slice(decl.length) : t;
  rest = rest
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trimStart();
  return decl ? decl + rest : rest;
}

/** Match `<score-partwise` only — not `<score-part`. */
const SCORE_PARTWISE_OPEN = /<score-partwise(?:\s|>)/gi;
const SCORE_PARTWISE_CLOSE = /<\/score-partwise>/gi;

function countScorePartwiseTags(doc: string): { open: number; close: number } {
  const open = (doc.match(SCORE_PARTWISE_OPEN) ?? []).length;
  const close = (doc.match(SCORE_PARTWISE_CLOSE) ?? []).length;
  return { open, close };
}

/**
 * Collapse duplicate / nested score-partwise wrappers into a single balanced root.
 */
export function collapseScorePartwiseRoot(doc: string): string {
  let t = stripPrologNoise(stripBom(decodeXmlEntities(doc))).trim();

  const firstOpen = t.search(/<score-partwise(?:\s|>)/i);
  if (firstOpen < 0) return t;

  const declMatch = t.slice(0, firstOpen).match(/^<\?xml[^?]*\?>/i);
  const decl = declMatch?.[0] ?? XML_DECLARATION_EXACT;

  const fromOpen = t.slice(firstOpen);
  const openTagMatch = fromOpen.match(/^<score-partwise[^>]*>/i);
  if (!openTagMatch) return t;

  const version =
    openTagMatch[0].match(/\bversion\s*=\s*["']([^"']+)["']/i)?.[1] ?? "3.1";

  let body = fromOpen.slice(openTagMatch[0].length);

  // Drop every nested score-partwise wrapper inside the body
  body = body
    .replace(/<score-partwise[^>]*>/gi, "")
    .replace(/<\/score-partwise>/gi, "")
    .trim();

  let doc2 =
    `${decl}\n<score-partwise version="${version}">\n${body}\n</score-partwise>`;

  if (!/<part-list\b/i.test(doc2)) {
    doc2 = doc2.replace(
      /<score-partwise[^>]*>/i,
      (m) => `${m}\n${buildMinimalPartList()}`,
    );
  }
  if (!/<part\s+[^>]*\bid\s*=/i.test(doc)) {
    doc2 = doc2.replace(/<\/score-partwise>/i, `${buildMinimalPart()}\n</score-partwise>`);
  }

  return doc;
}

function normalizePrologAndRoot(out: string): string {
  const withRoot = ensureScorePartwiseRoot(out);
  return collapseScorePartwiseRoot(withRoot);
}

export function repairAiMusicXml(xml: string): string {
  let out = ensureScorePartwiseRoot(xml);

  if (!/^\s*<\?xml\b/i.test(out)) {
    out = `${XML_DECLARATION_EXACT}\n${out}`;
  }

  out = out.replace(/<score-partwise(?!\s[^>]*\bversion\s*=)/i, '<score-partwise version="3.1"');

  out = out.replace(
    /<score-partwise([^>]*?)\s+xmlns(?::[a-zA-Z]*)?\s*=\s*"[^"]*"/gi,
    "<score-partwise$1",
  );
  out = out.replace(/<score-partwise\s{2,}/g, "<score-partwise ");

  const idPool = [...out.matchAll(/<part\s+[^>]*\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
  const queue = idPool.length > 0 ? [...idPool] : ["P1"];
  out = out.replace(/<score-part(?![^>]*\bid\s*=)/gi, () => `<score-part id="${queue.shift() ?? "P1"}"`);

  out = out.replace(/<clef>\s*treble\s*<\/clef>/gi, `<clef><sign>G</sign><line>2</line></clef>`);
  out = out.replace(/<clef>\s*bass\s*<\/clef>/gi, `<clef><sign>F</sign><line>4</line></clef>`);
  out = out.replace(/<clef>\s*alto\s*<\/clef>/gi, `<clef><sign>C</sign><line>3</line></clef>`);

  out = out.replace(/<measure(\s[^>]*)\/>/g, (_, attrs: string) =>
    `<measure${attrs}><note><rest/><duration>4</duration><type>whole</type></note></measure>`,
  );

  out = out.replace(
    /(<measure[^>]*\bnumber\s*=\s*"1"[^>]*>)(?!\s*<attributes)/,
    `$1<attributes><divisions>1</divisions>` +
      `<key><fifths>0</fifths></key>` +
      `<time><beats>4</beats><beat-type>4</beat-type></time>` +
      `<clef><sign>G</sign><line>2</line></clef></attributes>`,
  );

  out = out.replace(
    /(<attributes>(?![\s\S]*?<key\b)[\s\S]*?)(<time\b)/gi,
    `$1<key><fifths>0</fifths></key>$2`,
  );

  if (!/<\/score-partwise>/i.test(out)) {
    out = `${out}\n</score-partwise>`;
  }

  out = normalizePrologAndRoot(out);
  return collapseScorePartwiseRoot(ensureScorePartwiseRoot(out));
}

/** Repair + normalize for OSMD/MXL — always yields a single balanced score-partwise root. */
export function prepareMusicXmlForOsmd(doc: string): string {
  const repaired = repairAiMusicXml(doc);
  const collapsed = collapseScorePartwiseRoot(ensureScorePartwiseRoot(repaired));
  return ensureXmlDeclaration(collapsed);
}

export type MusicXmlValidation = { ok: true; doc: string } | { ok: false; error: string };

export function validateMusicXmlForOsmd(doc: string): MusicXmlValidation {
  const prepared = prepareMusicXmlForOsmd(doc);
  const trimmed = stripBom(prepared).trim();

  if (trimmed.length < 80) {
    return { ok: false, error: "Document too short to be MusicXML" };
  }
  if (!/^\s*<\?xml\b/i.test(trimmed)) {
    return { ok: false, error: "Missing XML declaration" };
  }
  if (!/<score-partwise\b/i.test(trimmed)) {
    return { ok: false, error: "Missing <score-partwise> root element" };
  }
  if (!/<\/score-partwise>/i.test(trimmed)) {
    return { ok: false, error: "Missing closing </score-partwise>" };
  }
  if (!/<part-list\b/i.test(trimmed) && !/<part\b/i.test(trimmed)) {
    return { ok: false, error: "Missing musical content (part-list or part)" };
  }

  const { open, close } = countScorePartwiseTags(trimmed);
  if (open !== 1 || close !== 1) {
    const fixed = collapseScorePartwiseRoot(trimmed);
    const recheck = countScorePartwiseTags(fixed);
    if (recheck.open === 1 && recheck.close === 1) {
      return { ok: true, doc: fixed };
    }
    return {
      ok: false,
      error: `Unbalanced score-partwise root (${open} open, ${close} close)`,
    };
  }

  return { ok: true, doc: trimmed };
}

export function normalizeAndValidateModelMusicXml(raw: string): MusicXmlValidation {
  const basis = extractMusicXmlFromModelText(raw);

  if (!basis) {
    const loose = decodeXmlEntities(stripMarkdownFences(extractXmlFromPossibleJson(raw)));
    if (loose.length >= 40 && /<(part-list|part|measure|note|pitch)\b/i.test(loose)) {
      return validateMusicXmlForOsmd(loose);
    }
    return { ok: false, error: "Could not locate usable XML in model output" };
  }

  return validateMusicXmlForOsmd(basis);
}
