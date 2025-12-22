"use client";

import { useEffect, useState } from "react";

type Consent = {
  essential: true;
  analytics: boolean;
  updatedAt: string;
};

const STORAGE_KEY = "cookieConsent";

const readConsent = (): Consent | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
};

const writeConsent = (consent: Consent) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: consent }));
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(existing.analytics);
    }
  }, []);

  const setConsent = (analyticsAllowed: boolean) => {
    const consent: Consent = {
      essential: true,
      analytics: analyticsAllowed,
      updatedAt: new Date().toISOString(),
    };
    writeConsent(consent);
    setAnalytics(analyticsAllowed);
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-4xl rounded-t-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">🔐 We use cookies to ensure essential site functionality and optional analytics.</p>
            <p className="text-sm text-slate-700">You can accept or reject non-essential cookies anytime.</p>
            {showPrefs && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>Analytics cookies (optional)</span>
                </label>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => setConsent(true)}
            >
              Accept all
            </button>
            <button
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 hover:-translate-y-0.5 hover:shadow"
              onClick={() => setConsent(false)}
            >
              Reject non-essential
            </button>
            <button
              className="text-sm font-semibold text-slate-700 underline"
              onClick={() => setShowPrefs((v) => !v)}
              type="button"
            >
              Manage preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
