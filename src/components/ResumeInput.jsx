import { useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export default function ResumeInput({ value, onChange }) {
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(' ') + '\n';
      }
      onChange(text.trim());
    } else {
      const text = await file.text();
      onChange(text);
    }
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Your Resume
        </label>
        <button
          onClick={() => fileRef.current.click()}
          className="text-xs px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          Upload PDF / TXT
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFile} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your resume here, or upload a PDF / .txt file above..."
        className="flex-1 min-h-64 w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm p-3 resize-none focus:outline-none focus:border-violet-500 placeholder-slate-500 font-mono leading-relaxed"
      />
      <p className="text-xs text-slate-500 text-right">{value.length} chars</p>
    </div>
  );
}
