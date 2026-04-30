"use client";

import { useState, useEffect } from "react";

type Evidence = {
  quote: string;
  type: "positive" | "negative" | "neutral";
  dimension: string;
  interpretation: string;
};

type AnalysisResult = {
  evidence: Evidence[];
  rubricScore: number;
  label: string;
  justification: string;
  kpiMapping: string[];
  gapAnalysis: string[];
  suggestedQuestions: string[];
};

type Sample = {
  id: string;
  fellowName: string;
  transcript: string;
};

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [samples, setSamples] = useState<Sample[]>([]);

  useEffect(() => {
    fetch("/api/samples")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSamples(data);
      })
      .catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError("Please paste a transcript first.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to analyze transcript.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (sampleTranscript: string) => {
    setTranscript(sampleTranscript);
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-5xl font-black tracking-tight text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Trinethra
            </h1>
            <p className="text-secondary font-medium">
              Diagnostic AI for DT Fellow Performance Analysis
            </p>
          </div>
          
          <div className="flex gap-2 bg-white/50 p-2 rounded-2xl glass-card border-none">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSample(s.transcript)}
                className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-white hover:shadow-sm transition-all text-secondary hover:text-primary whitespace-nowrap"
              >
                {s.fellowName}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Area */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-6 h-[600px] flex flex-col relative group">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Input Transcript</h2>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                  Step 1: Intake
                </span>
              </div>
              <textarea
                className="flex-1 w-full bg-transparent p-4 border border-blue-100 rounded-2xl resize-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all custom-scrollbar text-lg leading-relaxed placeholder:text-slate-300"
                placeholder="Paste the supervisor transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <div className="mt-4 flex items-center justify-between">
                {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !transcript.trim()}
                  className="ml-auto px-8 py-4 bg-primary hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-200 active:scale-95 flex items-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Run Diagnostic
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Result Area */}
          <div className="lg:col-span-7">
            <div className="glass-card p-8 min-h-[600px] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Analysis Draft</h2>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded">
                  Step 2: Review
                </span>
              </div>

              {!result && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 text-center space-y-4">
                  <div className="p-6 rounded-full bg-slate-50 border-2 border-dashed border-slate-200">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="max-w-xs text-lg font-medium">Ready for input. Paste a transcript to generate a diagnostic report.</p>
                </div>
              )}

              {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-indigo-50 border-b-indigo-600 rounded-full animate-spin-slow" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-bold text-slate-700 animate-pulse">Consulting Ollama...</p>
                    <p className="text-slate-400 text-sm">Evaluating behavioral patterns & biases</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-10 custom-scrollbar overflow-y-auto pr-2 pb-6">
                  {/* Score Hero */}
                  <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-colors" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      <div className="flex flex-col items-center">
                        <div className="text-7xl font-black tabular-nums">{result.rubricScore}</div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-70">Out of 10</div>
                      </div>
                      <div className="space-y-3 flex-1 text-center md:text-left">
                        <div className="inline-block px-3 py-1 bg-white/20 rounded-lg text-sm font-bold backdrop-blur-sm">
                          {result.label}
                        </div>
                        <p className="text-blue-50 leading-relaxed text-lg italic">
                          "{result.justification}"
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Evidence Grid */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Behavioral Evidence</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {result.evidence?.map((item, i) => (
                        <div 
                          key={i}
                          className={`p-5 rounded-2xl border transition-all hover:shadow-md group ${
                            item.type === "positive" ? "bg-emerald-50/50 border-emerald-100" :
                            item.type === "negative" ? "bg-rose-50/50 border-rose-100" :
                            "bg-slate-50 border-slate-100"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <p className="text-slate-800 font-medium leading-relaxed italic">
                              "{item.quote}"
                            </p>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shrink-0 ${
                              item.type === "positive" ? "bg-emerald-200 text-emerald-800" :
                              item.type === "negative" ? "bg-rose-200 text-rose-800" :
                              "bg-slate-200 text-slate-600"
                            }`}>
                              {item.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-400">Dimension:</span>
                            <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-100 shadow-sm uppercase tracking-wide">
                              {item.dimension.replace('_', ' ')}
                            </span>
                          </div>
                          {item.interpretation && (
                            <p className="mt-3 text-xs text-slate-500 bg-white/50 p-2 rounded-lg border border-white/50">
                              <span className="font-bold text-slate-400 mr-1">ANALYSIS:</span> {item.interpretation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* KPIs & Gaps Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">KPI Mapping</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.kpiMapping?.map((kpi, i) => (
                          <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 shadow-sm">
                            {kpi}
                          </span>
                        ))}
                      </div>
                    </section>
                    
                    <section className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Gap Analysis</h3>
                      <ul className="space-y-2">
                        {result.gapAnalysis?.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {/* Follow-up Section */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recommended Follow-up</h3>
                    <div className="space-y-3">
                      {result.suggestedQuestions?.map((q, i) => (
                        <div key={i} className="p-4 bg-white border-2 border-dashed border-blue-100 rounded-2xl flex gap-3 group hover:border-blue-300 transition-colors">
                          <span className="text-blue-500 font-black">?</span>
                          <p className="text-sm font-bold text-slate-700">{q}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </main>
  );
}
