import { useState } from "react";
import { diffLines, diffWords } from "diff";

const SECTION_KEYWORDS = new Set([
  "summary", "professional summary", "career summary", "executive summary",
  "objective", "career objective", "professional objective", "profile", "about",
  "experience", "work experience", "professional experience", "employment history",
  "career history", "work history",
  "education", "academic background", "educational background", "academics",
  "skills", "technical skills", "core skills", "key skills", "core competencies",
  "technical competencies", "technologies", "tech stack", "tools", "expertise",
  "projects", "personal projects", "academic projects", "key projects", "side projects",
  "open source", "notable projects",
  "certifications", "licenses", "credentials", "professional certifications",
  "awards", "honors", "achievements", "accomplishments", "recognition",
  "publications", "research", "presentations", "conference papers",
  "volunteer", "volunteering", "volunteer experience", "community service",
  "leadership", "activities", "extracurricular activities",
  "languages", "language skills", "interests", "hobbies",
  "references", "contact", "contact information", "memberships", "affiliations",
  "coursework", "relevant coursework", "training", "professional development",
  "patents", "grants", "research experience",
]);

function isSectionHeader(line) {
  const t = line.trim();
  if (t.length < 3 || t.length > 50) return false;
  if (!/^[A-Za-z][A-Za-z\s&/,]+$/.test(t)) return false;
  if (t === t.toUpperCase()) return true;
  return SECTION_KEYWORDS.has(t.toLowerCase());
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function downloadAsPDF(text) {
  const lines = text.split("\n");
  const firstIdx = lines.findIndex((l) => l.trim().length > 0);

  // Strict contact detection: only real contact patterns (email, phone, social links, pipe-separated short header)
  const isContactLine = (line, idx) => {
    const nonEmpty = lines.slice(0, idx + 1).filter((l) => l.trim()).length;
    if (nonEmpty > 5) return false;
    return (
      /\b[\w.+-]+@[\w-]+\.\w+\b/.test(line) ||
      /linkedin\.com|github\.com/i.test(line) ||
      /\b\+?1?[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/.test(line) ||
      (nonEmpty <= 3 && /\|/.test(line) && line.length < 120)
    );
  };
  const isBulletLine = (line) => /^\s*[•·\-–*]\s+/.test(line);
  const hasYear = (line) => /\b(19|20)\d{2}\b/.test(line);

  let body = "";
  let nameWritten = false;
  let prevNonEmpty = "";
  let inUl = false;
  let inSection = false;
  let afterBlank = false;
  // "entry" sections (experience/education/projects) bold their first line as a designation
  // "list" sections (skills/summary) do not
  let sectionType = "list";

  const closeUl = () => {
    if (inUl) { body += "</ul>"; inUl = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      closeUl();
      if (inSection) afterBlank = true;
      continue;
    }

    if (i === firstIdx && !nameWritten) {
      nameWritten = true;
      closeUl();
      body += `<h1 class="name">${escapeHtml(line)}</h1>`;
      prevNonEmpty = line;
      afterBlank = false;
      continue;
    }

    if (isContactLine(line, i)) {
      closeUl();
      body += `<p class="contact">${escapeHtml(line)}</p>`;
      prevNonEmpty = line;
      afterBlank = false;
      continue;
    }

    if (isSectionHeader(line)) {
      closeUl();
      body += `<div class="section-header">${escapeHtml(line)}</div>`;
      inSection = true;
      sectionType = /experience|education|project|certification|award|volunteer|leadership|publication|achievement/i.test(line)
        ? "entry" : "list";
      prevNonEmpty = line;
      afterBlank = false;
      continue;
    }

    if (isBulletLine(line)) {
      const content = line.replace(/^\s*[•·\-–*]\s+/, "");
      if (!inUl) { body += "<ul>"; inUl = true; }
      body += `<li>${escapeHtml(content)}</li>`;
      prevNonEmpty = line;
      afterBlank = false;
      continue;
    }

    closeUl();

    const prevIsHeaderOrName =
      isSectionHeader(prevNonEmpty) || prevNonEmpty === lines[firstIdx]?.trim();
    // Only bold designations in experience/education/project sections, not in skills/summary
    const isEntryTitle =
      sectionType === "entry" &&
      (prevIsHeaderOrName || afterBlank) &&
      line.length < 80 &&
      !hasYear(line);

    if (isEntryTitle) {
      const extraMargin = afterBlank ? ' style="margin-top:12pt;"' : '';
      body += `<p class="entry-title"${extraMargin}>${escapeHtml(line)}</p>`;
    } else if (hasYear(line)) {
      body += `<p class="entry-meta">${escapeHtml(line)}</p>`;
    } else {
      body += `<p class="body-line">${escapeHtml(line)}</p>`;
    }
    prevNonEmpty = line;
    afterBlank = false;
  }
  closeUl();

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Lato', Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 10.5pt;
      color: #1a1a1a;
      line-height: 1.5;
    }
    .page {
      width: 8.5in;
      margin: 0 auto;
      padding: 0.55in 0.75in;
    }
    h1.name {
      font-size: 21pt;
      font-weight: 700;
      text-align: center;
      color: #111;
      margin-bottom: 4pt;
      letter-spacing: 0.5pt;
    }
    p.contact {
      text-align: center;
      font-size: 9.5pt;
      color: #444;
      margin-bottom: 1.5pt;
    }
    .section-header {
      font-size: 9.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.8pt;
      text-align: center;
      color: #111;
      border-bottom: 0.75pt solid #222;
      padding-bottom: 2pt;
      margin-top: 13pt;
      margin-bottom: 5pt;
    }
    p.entry-title {
      font-weight: 700;
      font-size: 10.5pt;
      color: #111;
      margin-top: 3pt;
      text-align: left;
    }
    p.entry-meta {
      font-style: italic;
      font-size: 9.5pt;
      color: #555;
      margin-top: 1pt;
      margin-bottom: 3pt;
      text-align: left;
    }
    p.body-line {
      margin-bottom: 2pt;
      text-align: left;
    }
    ul {
      margin-left: 15pt;
      margin-top: 2pt;
      margin-bottom: 3pt;
      text-align: left;
    }
    li {
      margin-bottom: 2.5pt;
      list-style-type: disc;
    }
    @page { margin: 0; size: letter; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resume</title><style>${css}</style></head><body><div class="page">${body}</div></body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(fullHtml);
  iframeDoc.close();

  iframe.contentWindow.document.fonts.ready.then(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 1000);
  });
}

function buildSideBySideRows(original, tailored) {
  const chunks = diffLines(original || "", tailored || "");
  console.log("chunks", chunks);
  const rows = [];
  let leftNum = 1;
  let rightNum = 1;
  let i = 0;

  while (i < chunks.length) {
    const chunk = chunks[i];

    if (!chunk.added && !chunk.removed) {
      const lines = chunk.value.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      for (const line of lines) {
        rows.push({
          type: "unchanged",
          leftLine: line,
          rightLine: line,
          leftNum: leftNum++,
          rightNum: rightNum++,
          wordDiff: null,
        });
      }
      i++;
      continue;
    }

    if (chunk.removed) {
      const removedLines = chunk.value.split("\n");
      if (removedLines[removedLines.length - 1] === "") removedLines.pop();

      let addedLines = [];
      if (i + 1 < chunks.length && chunks[i + 1].added) {
        addedLines = chunks[i + 1].value.split("\n");
        if (addedLines[addedLines.length - 1] === "") addedLines.pop();
        i += 2;
      } else {
        i++;
      }

      const maxLen = Math.max(removedLines.length, addedLines.length);
      for (let j = 0; j < maxLen; j++) {
        const leftLine = j < removedLines.length ? removedLines[j] : null;
        const rightLine = j < addedLines.length ? addedLines[j] : null;

        if (leftLine !== null && rightLine !== null) {
          rows.push({
            type: "changed",
            leftLine,
            rightLine,
            leftNum: leftNum++,
            rightNum: rightNum++,
            wordDiff: diffWords(leftLine, rightLine),
          });
        } else if (leftLine !== null) {
          rows.push({
            type: "removed",
            leftLine,
            rightLine: null,
            leftNum: leftNum++,
            rightNum: null,
            wordDiff: null,
          });
        } else {
          rows.push({
            type: "added",
            leftLine: null,
            rightLine,
            leftNum: null,
            rightNum: rightNum++,
            wordDiff: null,
          });
        }
      }
      continue;
    }

    if (chunk.added) {
      const addedLines = chunk.value.split("\n");
      if (addedLines[addedLines.length - 1] === "") addedLines.pop();
      for (const line of addedLines) {
        rows.push({
          type: "added",
          leftLine: null,
          rightLine: line,
          leftNum: null,
          rightNum: rightNum++,
          wordDiff: null,
        });
      }
      i++;
    }
  }

  return rows;
}

export default function DiffViewer({ original, tailored }) {
  const [mode, setMode] = useState("diff");

  const tabs = [
    { id: "original", label: "Original" },
    { id: "diff", label: "Diff" },
    { id: "tailored", label: "Tailored" },
  ];

  const rows = buildSideBySideRows(original, tailored);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === t.id
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-400">
          {mode === "diff" && (
            <>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-900 border border-red-600" />
                Removed
              </span>
              <span className="flex items-center gap-1 ml-3">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-900 border border-green-600" />
                Added
              </span>
            </>
          )}
          {mode === "original" && <span>Original resume</span>}
          {mode === "tailored" && <span>AI-tailored resume</span>}
        </div>

        <div className="overflow-auto max-h-150 bg-slate-900 font-mono text-sm">
          {mode === "original" && (
            <pre className="p-4 text-slate-300 whitespace-pre-wrap leading-relaxed">
              {original}
            </pre>
          )}

          {mode === "tailored" && (
            <pre className="p-4 text-slate-300 whitespace-pre-wrap leading-relaxed">
              {tailored}
            </pre>
          )}

          {mode === "diff" && (
            <div>
              {/* Column headers */}
              <div className="flex sticky top-0 z-10 border-b border-slate-700">
                <div className="flex-1 flex items-center gap-1.5 bg-slate-800/95 px-3 py-1.5 border-r border-slate-700 text-xs text-slate-300 font-medium">
                  <span className="inline-block w-2 h-2 rounded-sm bg-red-700" />
                  Original
                </div>
                <div className="flex-1 flex items-center gap-1.5 bg-slate-800/95 px-3 py-1.5 text-xs text-slate-300 font-medium">
                  <span className="inline-block w-2 h-2 rounded-sm bg-green-700" />
                  Tailored
                </div>
              </div>

              {/* Diff rows */}
              {rows.map((row, i) => (
                <div key={i} className="flex border-b border-slate-800/40">
                  {/* Left cell */}
                  <div
                    className={`flex-1 flex items-start min-w-0 border-r border-slate-700/50 ${
                      row.type === "removed"
                        ? "bg-red-950/60"
                        : row.type === "added"
                          ? "bg-red-950/10"
                          : row.type === "changed"
                            ? "bg-red-950/40"
                            : ""
                    }`}
                  >
                    <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-slate-600 select-none text-xs leading-relaxed border-r border-slate-700/40">
                      {row.leftNum ?? ""}
                    </span>
                    <pre className="flex-1 px-3 py-0.5 whitespace-pre-wrap leading-relaxed text-slate-300 text-xs min-w-0">
                      {row.type === "changed"
                        ? row.wordDiff
                            .filter((t) => !t.added)
                            .map((t, ti) =>
                              t.removed ? (
                                <span
                                  key={ti}
                                  className="bg-red-700/60 text-red-200 rounded-sm"
                                >
                                  {t.value}
                                </span>
                              ) : (
                                <span key={ti}>{t.value}</span>
                              ),
                            )
                        : (row.leftLine ?? "")}
                    </pre>
                  </div>

                  {/* Right cell */}
                  <div
                    className={`flex-1 flex items-start min-w-0 ${
                      row.type === "added"
                        ? "bg-green-950/60"
                        : row.type === "removed"
                          ? "bg-green-950/10"
                          : row.type === "changed"
                            ? "bg-green-950/40"
                            : ""
                    }`}
                  >
                    <span className="w-10 shrink-0 text-right pr-2 py-0.5 text-slate-600 select-none text-xs leading-relaxed border-r border-slate-700/40">
                      {row.rightNum ?? ""}
                    </span>
                    <pre className="flex-1 px-3 py-0.5 whitespace-pre-wrap leading-relaxed text-slate-300 text-xs min-w-0">
                      {row.type === "changed"
                        ? row.wordDiff
                            .filter((t) => !t.removed)
                            .map((t, ti) =>
                              t.added ? (
                                <span
                                  key={ti}
                                  className="bg-green-700/60 text-green-200 rounded-sm"
                                >
                                  {t.value}
                                </span>
                              ) : (
                                <span key={ti}>{t.value}</span>
                              ),
                            )
                        : (row.rightLine ?? "")}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === "tailored" && (
        <div className="flex gap-2 self-end">
          <button
            onClick={() => downloadAsPDF(tailored)}
            className="text-xs px-3 py-1.5 rounded-md bg-violet-700 hover:bg-violet-600 text-white transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(tailored)}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
