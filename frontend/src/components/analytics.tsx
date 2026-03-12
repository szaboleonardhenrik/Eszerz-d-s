"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function Analytics({ gaId }: { gaId: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => {
      setConsented(localStorage.getItem("cookie_consent") === "accepted");
    };
    check();

    // Re-check when cookie consent changes (e.g. user accepts after page load)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cookie_consent") check();
    };
    window.addEventListener("storage", onStorage);

    // Also listen for same-tab changes via a custom event
    const onConsent = () => check();
    window.addEventListener("cookie_consent_changed", onConsent);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cookie_consent_changed", onConsent);
    };
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`}
      </Script>
    </>
  );
}
