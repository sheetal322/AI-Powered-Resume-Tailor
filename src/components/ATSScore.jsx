function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 140, height: 140 }}
    >
      <svg width="140" height="140" className="-rotate-90 absolute inset-0">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="text-4xl font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function ATSScore({ data }) {
  if (!data) return null;
  const { score, missing = [], present = [] } = data;

  const label =
    score >= 75
      ? "Strong Match"
      : score >= 50
        ? "Moderate Match"
        : "Weak Match";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-8">
        <div className="relative flex flex-col items-center">
          <ScoreRing score={score} />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-200">{label}</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            {score >= 75
              ? "Your resume is well-aligned with this job. Great keyword coverage!"
              : score >= 50
                ? "Decent match. Adding missing keywords could improve your chances."
                : "Several key skills are missing. Review the gaps below."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {missing.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
              Missing Keywords ({missing.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {missing.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-full text-xs bg-red-900/40 text-red-300 border border-red-800"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
        {present.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
              Keywords Found ({present.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {present.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-300 border border-green-800"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
