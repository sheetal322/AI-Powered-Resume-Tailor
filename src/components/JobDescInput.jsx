export default function JobDescInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2 h-full">
      <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        Job Description
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here..."
        className="flex-1 min-h-64 w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm p-3 resize-none focus:outline-none focus:border-violet-500 placeholder-slate-500 leading-relaxed"
      />
      <p className="text-xs text-slate-500 text-right">{value.length} chars</p>
    </div>
  );
}
