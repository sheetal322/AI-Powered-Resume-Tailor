import { useState } from 'react';

export default function CoverLetter({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          AI-generated cover letter — review and personalize before sending.
        </p>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors min-w-[100px]"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
        <p className="text-slate-200 leading-7 whitespace-pre-wrap text-sm">{text}</p>
      </div>
    </div>
  );
}
