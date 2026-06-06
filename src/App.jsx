import { useState } from "react";
import ResumeInput from "./components/ResumeInput";
import JobDescInput from "./components/JobDescInput";
import ATSScore from "./components/ATSScore";
import DiffViewer from "./components/DiffViewer";
import CoverLetter from "./components/CoverLetter";

const TABS = [
  { id: "ats", label: "ATS Score" },
  { id: "resume", label: "Tailored Resume" },
  { id: "cover", label: "Cover Letter" },
];

export default function App() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ats");
  const [results, setResults] = useState(null);

  async function handleAnalyze() {
    if (!resume.trim() || !jobDesc.trim()) {
      setError("Please provide both your resume and the job description.");
      return;
    }
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const [atsRes, tailorRes] = await Promise.all([
        fetch("/api/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume, jobDescription: jobDesc }),
        }),
        fetch("/api/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume, jobDescription: jobDesc }),
        }),
      ]);

      if (!atsRes.ok || !tailorRes.ok) {
        const msg = await (atsRes.ok ? tailorRes : atsRes).text();
        console.error(
          "API error response text:",
          msg.slice ? msg.slice(0, 1000) : msg,
        );
        throw new Error(msg || "API request failed");
      }

      const [ats, tailor] = await Promise.all([
        atsRes.json(),
        tailorRes.json(),
      ]);
      setResults({ ats, tailor });
      setActiveTab("ats");
    } catch (err) {
      console.error("handleAnalyze error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
            RT
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-none">
              Resume Tailor
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              AI-powered · Free · Powered by Groq + Llama 3.3
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Input section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <ResumeInput value={resume} onChange={setResume} />
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <JobDescInput value={jobDesc} onChange={setJobDesc} />
          </div>
        </div>

        {/* Analyze button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors flex items-center gap-2 shadow-lg shadow-violet-900/30"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyzing with AI...
              </>
            ) : (
              "Analyze & Tailor Resume"
            )}
          </button>
          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Results section */}
        {results && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === "ats" && <ATSScore data={results.ats} />}
              {activeTab === "resume" && (
                <DiffViewer
                  original={resume}
                  tailored={results.tailor.tailoredResume}
                />
              )}
              {activeTab === "cover" && (
                <CoverLetter text={results.tailor.coverLetter} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
