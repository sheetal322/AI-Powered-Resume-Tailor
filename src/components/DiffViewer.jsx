import { useState } from "react";
import { diffLines, diffWords } from "diff";
import { downloadAsPDF } from "../utils/downloadPDF";

function buildSideBySideRows(original, tailored) {
  const chunks = diffLines(original || "", tailored || "");
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
