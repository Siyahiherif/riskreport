"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const STORAGE_KEY = "cookieConsent";

type Consent = {
  essential: true;
  analytics: boolean;
  updatedAt: string;
};

export default function Gtag() {
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as Consent;
        return !!parsed.analytics;
      } catch {
        return false;
      }
    };
    setAllowAnalytics(read());
    const handler = () => setAllowAnalytics(read());
    window.addEventListener("cookie-consent-changed", handler);
    return () => window.removeEventListener("cookie-consent-changed", handler);
  }, []);

  if (!allowAnalytics) return null;

  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-FT174XV423" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-FT174XV423');
        `}
      </Script>
    </>
  );
}
