"use client";

import { useState } from "react";
import { COMPLIANCE_QUESTIONS, Question } from "@/lib/compliance/questions";

type Answers = Record<string, string | string[]>;

type SubmitResult = {
  downloadUrl: string;
  reportToken: string;
  score: number;
  riskLevel: string;
  readiness: { iso27001: string; kvkk: string; soc2: string };
  expiresAt: string;
};

const isChecked = (value: string, list: string[]) => list.includes(value);

export default function CompliancePage() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const setSingle = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMulti = (id: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[id] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [id]: current.filter((v) => v !== value) };
      }
      return { ...prev, [id]: [...current, value] };
    });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email) {
      setError("Email gerekli.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/compliance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName, answers }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gonderim basarisiz");
      }
      setResult(json);
    } catch (err: any) {
      setError(err?.message || "Hata olustu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-500">Compliance Readiness + Policy Docs</p>
          <h1 className="text-3xl font-semibold">Compliance Readiness & Policy Documents</h1>
          <p className="mt-2 text-sm text-slate-700">
            5 soruluk kisa form (sirket adi dahil) ile compliance readiness degerlendirmesi yapar ve BG Olay ve Siber Olay
            Yonetimi Proseduru dokumanini sirketinize ozel uretir.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase text-slate-500">Preview</p>
            <h2 className="mt-2 text-lg font-semibold">PDF preview (excerpt)</h2>
            <p className="mt-2 text-sm text-slate-700">
              Asagidaki onizleme dokumandan kisa bir bolumdur. Tam dokuman odeme sonrasi teslim edilir.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <iframe
                title="PDF preview"
                src="/api/compliance/preview"
                className="h-96 w-full"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <h3 className="text-sm font-semibold text-slate-900">Teslim edilecek dokuman</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>- BG Olay ve Siber Olay Yonetimi Proseduru (PDF)</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Not: Onizleme kisa tutulur. Tam dokuman, sirketinize ozel PDF olarak uretilir.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Iletisim</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Sirket Adi (opsiyonel)
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Orn. Example A.S."
              />
            </label>
            <label className="text-sm text-slate-700">
              Email (zorunlu)
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="you@company.com"
                type="email"
                required
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-600">Sadece e-posta, rapor ID ve tarih saklanir. 7 gun sonra silinir.</p>
        </div>

        <div className="space-y-4">
          {COMPLIANCE_QUESTIONS.map((q) => (
            <QuestionBlock
              key={q.id}
              question={q}
              answer={answers[q.id]}
              onSingle={setSingle}
              onMulti={toggleMulti}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Isleniyor..." : "Dokumanlari olustur"}
        </button>

        {result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Teslimat Hazir</h2>
            <p className="text-sm text-slate-700 mt-2">Rapor ID: {result.reportToken}</p>
            <p className="text-sm text-slate-700">Risk skoru: {result.score} / 100 - {result.riskLevel}</p>
            <p className="text-sm text-slate-700">ISO 27001: {result.readiness.iso27001} | KVKK: {result.readiness.kvkk} | SOC2: {result.readiness.soc2}</p>
            <a
              href={result.downloadUrl}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              ZIP paketi indir
            </a>
            <p className="mt-2 text-xs text-slate-600">Link {new Date(result.expiresAt).toLocaleDateString()} tarihinde sona erer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionBlock({
  question,
  answer,
  onSingle,
  onMulti,
}: {
  question: Question;
  answer: string | string[] | undefined;
  onSingle: (id: string, value: string) => void;
  onMulti: (id: string, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <p className="text-sm font-semibold text-slate-900">{question.label}</p>
      {question.type === "text" && (
        <input
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Yanitinizi yazin"
          value={(answer as string) || ""}
          onChange={(e) => onSingle(question.id, e.target.value)}
        />
      )}
      {question.type === "single" && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {question.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={question.id}
                value={opt.value}
                checked={answer === opt.value}
                onChange={() => onSingle(question.id, opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
      {question.type === "multi" && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {question.options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isChecked(opt.value, (answer as string[]) || [])}
                onChange={() => onMulti(question.id, opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
