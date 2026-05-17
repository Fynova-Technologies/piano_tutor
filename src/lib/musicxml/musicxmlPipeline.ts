export const XML_DECLARATION_EXACT = '<?xml version="1.0" encoding="UTF-8"?>';

export function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, "").trim();
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
    for (const k of ["musicXml", "musicxml", "xml", "score", "content", "data"]) {
      const v = o[k];
      if (typeof v === "string" && /<\s*(score-partwise|part|score)\b/i.test(v)) return v;
    }
  } catch {
    /* not JSON */
  }
  return text;
}

export function sliceScorePartwiseDocument(text: string): string | null {
  const t = stripMarkdownFences(extractXmlFromPossibleJson(text));
  const lower = t.toLowerCase();
  const openIdx = lower.search(/<\?xml|<score-partwise\b/);
  if (openIdx < 0) return null;

  let slice = t.slice(openIdx);
  const closeTag = "</score-partwise>";
  const closeIdx = slice.lastIndexOf(closeTag);

  if (closeIdx < 0) {
    return /<score-partwise[\s>]/i.test(slice) ? slice.trim() : null;
  }

  slice = slice.slice(0, closeIdx + closeTag.length);
  if (!/<score-partwise[\s>]/i.test(slice)) return null;
  return slice.trim();
}

export function extractLooseXmlPayload(text: string): string {
  const t = stripMarkdownFences(extractXmlFromPossibleJson(text));
  const i = t.search(/<\?xml|<score\b|<score-partwise\b|<musicxml\b|<music-score\b|<part-list\b|<part\b/i);
  return (i >= 0 ? t.slice(i) : t).trim();
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
  return `${XML_DECLARATION_EXACT}\n<score-partwise version="3.1">\n  ${buildMinimalPartList()}\n  ${buildMinimalPart()}\n</score-partwise>`;
}

/** Strip DOCTYPE and comments that sit between the XML prolog and the score root. */
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

/**
 * Normalize prolog + score-partwise root for OSMD without requiring an exact second line.
 */
function normalizePrologAndRoot(out: string): string {
  let t = stripPrologNoise(out);

  const rootIdx = t.search(/<score-partwise\b/i);
  if (rootIdx < 0) return t;

  const declMatch = t.slice(0, rootIdx).match(/^<\?xml[^?]*\?>\s*/i);
  const decl = declMatch?.[0]?.trimEnd() ? `${declMatch[0].trim()}\n` : `${XML_DECLARATION_EXACT}\n`;

  const fromRoot = t.slice(rootIdx);
  const openEnd = fromRoot.indexOf(">");
  if (openEnd < 0) return t;

  const openTag = fromRoot.slice(0, openEnd + 1);
  const versionMatch = openTag.match(/\bversion\s*=\s*["']([^"']+)["']/i);
  const version = versionMatch?.[1] ?? "3.1";
  const afterOpen = fromRoot.slice(openEnd + 1);
  const closeTag = "</score-partwise>";
  const closeIdx = afterOpen.lastIndexOf(closeTag);
  const body = closeIdx >= 0 ? afterOpen.slice(0, closeIdx).trim() : afterOpen.trim();

  let doc =
    `${decl}<score-partwise version="${version}">\n` +
    `${body}\n` +
    `</score-partwise>`;

  if (!/<part-list\b/i.test(doc)) {
    doc = doc.replace(
      /<score-partwise[^>]*>/i,
      (m) => `${m}\n${buildMinimalPartList()}`
    );
  }
  if (!/<part\s+[^>]*\bid\s*=/i.test(doc)) {
    doc = doc.replace(/<\/score-partwise>/i, `${buildMinimalPart()}\n</score-partwise>`);
  }

  return doc;
}

export function repairAiMusicXml(xml: string): string {
  let out = stripBom(xml).trim();

  if (!/^\s*<\?xml\b/i.test(out)) {
    out = `${XML_DECLARATION_EXACT}\n${out}`;
  }

  if (!/<score-partwise\b/i.test(out)) {
    console.warn("[XML repair] No <score-partwise> — attempting root fix");
    if (/<score(\s[^>]*)?>/i.test(out)) {
      out = out
        .replace(/<score(\s[^>]*)?>/i, '<score-partwise version="3.1">')
        .replace(/<\/score>/gi, "</score-partwise>");
    } else if (/<musicxml\b/i.test(out) || /<music-score\b/i.test(out)) {
      out = out
        .replace(/<(musicxml|music-score)(\s[^>]*)?>/gi, '<score-partwise version="3.1">')
        .replace(/<\/(musicxml|music-score)>/gi, "</score-partwise>");
    } else if (/<part\b/i.test(out)) {
      const partListMatch = out.match(/<part-list[\s\S]*?<\/part-list>/i);
      const partMatches = [...out.matchAll(/<part\b[\s\S]*?<\/part>/gi)];
      const partList = partListMatch?.[0] ?? buildMinimalPartList();
      const parts =
        partMatches.length > 0 ? partMatches.map((m) => m[0]).join("\n") : buildMinimalPart();
      out = `${XML_DECLARATION_EXACT}\n<score-partwise version="3.1">\n${partList}\n${parts}\n</score-partwise>`;
    } else {
      return buildMinimalScore();
    }
  }

  out = out.replace(/<score-partwise(?!\s[^>]*\bversion\s*=)/i, '<score-partwise version="3.1"');

  out = out.replace(
    /<score-partwise([^>]*?)\s+xmlns(?::[a-zA-Z]*)?\s*=\s*"[^"]*"/gi,
    "<score-partwise$1"
  );
  out = out.replace(/<score-partwise\s{2,}/g, "<score-partwise ");

  const idPool = [...out.matchAll(/<part\s+[^>]*\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
  const queue = idPool.length > 0 ? [...idPool] : ["P1"];
  out = out.replace(/<score-part(?![^>]*\bid\s*=)/gi, () => `<score-part id="${queue.shift() ?? "P1"}"`);

  out = out.replace(/<clef>\s*treble\s*<\/clef>/gi, `<clef><sign>G</sign><line>2</line></clef>`);
  out = out.replace(/<clef>\s*bass\s*<\/clef>/gi, `<clef><sign>F</sign><line>4</line></clef>`);
  out = out.replace(/<clef>\s*alto\s*<\/clef>/gi, `<clef><sign>C</sign><line>3</line></clef>`);

  out = out.replace(/<measure(\s[^>]*)\/>/g, (_, attrs: string) =>
    `<measure${attrs}><note><rest/><duration>4</duration><type>whole</type></note></measure>`
  );

  out = out.replace(
    /(<measure[^>]*\bnumber\s*=\s*"1"[^>]*>)(?!\s*<attributes)/,
    `$1<attributes><divisions>1</divisions>` +
      `<key><fifths>0</fifths></key>` +
      `<time><beats>4</beats><beat-type>4</beat-type></time>` +
      `<clef><sign>G</sign><line>2</line></clef></attributes>`
  );

  out = out.replace(
    /(<attributes>(?![\s\S]*?<key\b)[\s\S]*?)(<time\b)/gi,
    `$1<key><fifths>0</fifths></key>$2`
  );

  if (!/<\/score-partwise>/i.test(out)) {
    out = `${out}\n</score-partwise>`;
  }

  return normalizePrologAndRoot(out);
}

/** Repair + normalize for OSMD/MXL — does not reject on exact prolog layout. */
export function prepareMusicXmlForOsmd(doc: string): string {
  const repaired = repairAiMusicXml(doc);
  return ensureXmlDeclaration(repaired);
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

  const open = (trimmed.match(/<score-partwise\b/gi) ?? []).length;
  const close = (trimmed.match(/<\/score-partwise>/gi) ?? []).length;
  if (open !== 1 || close !== 1) {
    return { ok: false, error: "Unbalanced score-partwise root" };
  }

  return { ok: true, doc: trimmed };
}

export function normalizeAndValidateModelMusicXml(raw: string): MusicXmlValidation {
  const sliced = sliceScorePartwiseDocument(raw);
  const basis =
    sliced ??
    (() => {
      const loose = extractLooseXmlPayload(raw);
      return loose.length >= 20 ? loose : null;
    })();

  if (!basis) {
    return { ok: false, error: "Could not locate usable XML in model output" };
  }

  return validateMusicXmlForOsmd(basis);
}
