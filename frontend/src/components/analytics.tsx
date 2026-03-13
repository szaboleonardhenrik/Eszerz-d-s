"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function isAnalyticsConsented(): boolean {
  try {
    const stored = localStorage.getItem("cookie_consent");
    if (!stored) return false;
    // Support legacy "accepted" string format
    if (stored === "accepted") return true;
    const parsed = JSON.parse(stored);
    return parsed?.analytics === true;
  } catch {
    return false;
  }
}

function clearGaCookies() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    // GA4 cookies: _ga, _ga_<container-id>, _gid, _gat
    if (name.startsWith("_ga") || name === "_gid" || name.startsWith("_gat")) {
      // Delete on current domain and parent domains
      const domains = [
        window.location.hostname,
        "." + window.location.hostname,
        "." + window.location.hostname.split(".").slice(-2).join("."),
      ];
      for (const domain of domains) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
      }
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }
}

export default function Analytics({ gaId }: { gaId: string }) {
  const [consented, setConsented] = useState(false);
  const pathname = usePathname();

  const check = useCallback(() => {
    const allowed = isAnalyticsConsented();
    setConsented(allowed);
    if (!allowed) {
      clearGaCookies();
    }
  }, []);

  useEffect(() => {
    check();

    // Re-check when cookie consent changes across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cookie_consent") check();
    };
    window.addEventListener("storage", onStorage);

    // Same-tab consent changes via custom event
    const onConsent = () => check();
    window.addEventListener("cookie_consent_changed", onConsent);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cookie_consent_changed", onConsent);
    };
  }, [check]);

  // Send pageview on route change
  useEffect(() => {
    if (consented && window.gtag) {
      window.gtag("config", gaId, { page_path: pathname });
    }
  }, [pathname, consented, gaId]);

  if (!consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`}
      </Script>
    </>
  );
}
