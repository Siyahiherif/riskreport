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
            Bu araç, denetime hazirlik ve iç süreçlerinizi düzenlemek amacıyla otomatik dokümantasyon üretir.
            Resmi sertifikasyon veya %100 uyum garantisi vermez.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            5 soruluk kısa form (şirket adı dahil) ile compliance readiness değerlendirmesi yapar ve BG Olay ve Siber Olay
            Yönetimi Prosedürü dokumanını şirketinize özel üretir.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase text-slate-500">Preview</p>
            <h2 className="mt-2 text-lg font-semibold">PDF preview (excerpt)</h2>
            <p className="mt-2 text-sm text-slate-700">
              Aşağıdaki onizleme dokumandan kısa bir bölümüdür. Tam dokuman ödeme sonrası teslim edilir.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <iframe
                title="PDF preview"
                src="/api/compliance/preview"
                className="h-96 w-full"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Önizleme, dokumanin kisaltılmış bir bölümüdür. Tam dokuman, ödeme sonrası şirketinize özel olarak
              oluşturulur ve PDF formatında teslim edilir. Bu dokumanlar, resmi kurum onayı içermez.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <h3 className="text-sm font-semibold text-slate-900">Teslim edilecek doküman</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>- BG Olay ve Siber Olay Yönetimi Prosedürü (PDF)</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Not: Önizleme kısa tutulur. Tam doküman, şirketinize özel PDF olarak üretilir.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Not: Üretilen dokümanlar örnek ve taslak niteliktedir. Şirketinizin iç süreçlerine göre gözden
              gecirilmesi ve onaylanmasi onerilir.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <p className="text-sm text-slate-700">
            Aşağıdaki sorular, şirketinizin genel yapısını anlamak ve uygun dokümantasyonu oluşturmak amacıyla
            sorulmaktadir. Yanıtlarınız teknik denetim yerine geçmez.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">İletişim</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Şirket Adı (opsiyonel)
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
        <p className="text-xs text-slate-500">
          Üretilen dokümanlar taslak niteliktedir. Şirket içi onay süreçlerinden geçirilmelidir.
        </p>

        {result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Teslimat Hazır</h2>
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">SSS</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold">Bu dokümanlar ISO 27001 belgesi yerine geçer mi?</p>
              <p>
                Hayır. Bu dokümanlar ISO 27001 belgelendirmesi yerine geçmez. Ancak belgelendirme oncesi gerekli temel
                dokümantasyonu olusturmak icin kullanilabilir.
              </p>
            </div>
            <div>
              <p className="font-semibold">Bu dokümanlar resmi olarak onaylı mı?</p>
              <p>
                Hayır. Dokümanlar şirketinize özel olarak otomatik üretilir ve taslak niteliktedir. Resmi kurum onayi
                icermez.
              </p>
            </div>
            <div>
              <p className="font-semibold">Denetimde bu dokümanları kullanabilir miyim?</p>
              <p>
                Evet, birçok denetimde başlangıç dokümantasyonu olarak kullanılabilir. Ancak denetim kapsamına göre ek
                calismalar gerekebilir.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <p className="text-xs text-slate-500">
            Bu platform tarafından üretilen rapor ve dokümanlar, bilgilendirme ve denetime hazirlik amaclidir. Herhangi
            bir resmi kurum, sertifikasyon kurulus ve/veya düzenleyici otorite tarafından onaylanmış oldugu anlamina
            gelmez.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            CyberFaceX, bu dokümanların kullanımı sonucu oluşabilecek doğrudan veya dolaylı zararlardan sorumlu
            tutulamaz.
          </p>
        </div>
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
