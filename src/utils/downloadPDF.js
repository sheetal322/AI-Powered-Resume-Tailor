const SECTION_KEYWORDS = new Set([
  "summary",
  "professional summary",
  "career summary",
  "executive summary",
  "objective",
  "career objective",
  "professional objective",
  "profile",
  "about",
  "experience",
  "work experience",
  "professional experience",
  "employment history",
  "career history",
  "work history",
  "education",
  "academic background",
  "educational background",
  "academics",
  "skills",
  "technical skills",
  "core skills",
  "key skills",
  "core competencies",
  "technical competencies",
  "technologies",
  "tech stack",
  "tools",
  "expertise",
  "projects",
  "personal projects",
  "academic projects",
  "key projects",
  "side projects",
  "open source",
  "notable projects",
  "certifications",
  "licenses",
  "credentials",
  "professional certifications",
  "awards",
  "honors",
  "achievements",
  "accomplishments",
  "recognition",
  "publications",
  "research",
  "presentations",
  "conference papers",
  "volunteer",
  "volunteering",
  "volunteer experience",
  "community service",
  "leadership",
  "activities",
  "extracurricular activities",
  "languages",
  "language skills",
  "interests",
  "hobbies",
  "references",
  "contact",
  "contact information",
  "memberships",
  "affiliations",
  "coursework",
  "relevant coursework",
  "training",
  "professional development",
  "patents",
  "grants",
  "research experience",
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

export function downloadAsPDF(text) {
  const lines = text.split("\n");
  const firstIdx = lines.findIndex((l) => l.trim().length > 0);

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
  let sectionType = "list";

  const closeUl = () => {
    if (inUl) {
      body += "</ul>";
      inUl = false;
    }
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
      sectionType =
        /experience|education|project|certification|award|volunteer|leadership|publication|achievement/i.test(
          line,
        )
          ? "entry"
          : "list";
      prevNonEmpty = line;
      afterBlank = false;
      continue;
    }

    if (isBulletLine(line)) {
      const content = line.replace(/^\s*[•·\-–*]\s+/, "");
      if (!inUl) {
        body += "<ul>";
        inUl = true;
      }
      body += `<li>${escapeHtml(content)}</li>`;
      prevNonEmpty = line;
      afterBlank = false;
      continue;
    }

    closeUl();

    const prevIsHeaderOrName =
      isSectionHeader(prevNonEmpty) || prevNonEmpty === lines[firstIdx]?.trim();
    const isEntryTitle =
      sectionType === "entry" &&
      (prevIsHeaderOrName || afterBlank) &&
      line.length < 80 &&
      !hasYear(line);

    if (isEntryTitle) {
      const extraMargin = afterBlank ? ' style="margin-top:12pt;"' : "";
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
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden;";
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
