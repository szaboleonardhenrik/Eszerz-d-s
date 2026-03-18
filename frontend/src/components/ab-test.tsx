"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Variant = "A" | "B";

const ABContext = createContext<Variant>("A");

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function ABTestProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<Variant>("A");

  useEffect(() => {
    const existing = getCookie("ab_variant");
    if (existing === "A" || existing === "B") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVariant(existing);
    } else {
      const picked: Variant = Math.random() < 0.5 ? "A" : "B";
      setCookie("ab_variant", picked, 30);
       
      setVariant(picked);
    }
  }, []);

  return <ABContext.Provider value={variant}>{children}</ABContext.Provider>;
}

export function useABVariant(): Variant {
  return useContext(ABContext);
}

export function ABVariant({ variant, children }: { variant: Variant; children: ReactNode }) {
  const current = useABVariant();
  if (current !== variant) return null;
  return <>{children}</>;
}
