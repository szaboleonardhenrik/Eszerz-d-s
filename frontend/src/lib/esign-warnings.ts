/**
 * E-signature type warnings for contract templates.
 *
 * Certain contract categories in Hungarian law require qualified (QES)
 * or advanced (AES) electronic signatures instead of simple e-signatures.
 * This helper returns the appropriate warning text based on template
 * category and name.
 */

export function getEsignWarning(
  category: string,
  name?: string
): string | null {
  const cat = category?.toLowerCase() ?? "";
  const title = name?.toLowerCase() ?? "";

  // Real estate contracts require QES
  if (cat.includes("ingatlan") || title.includes("ingatlan")) {
    return "Ingatlan szerződésekhez minősített elektronikus aláírás (QES) szükséges. Ingatlan adásvételhez ügyvédi ellenjegyzés is szükséges (Inytv. 32. §).";
  }

  // Loan / credit contracts require QES
  if (
    cat.includes("hitel") ||
    cat.includes("kölcsön") ||
    cat.includes("kolcson") ||
    cat.includes("penzugyi") ||
    title.includes("hitel") ||
    title.includes("kölcsön") ||
    title.includes("kolcson")
  ) {
    return "Hitel- és kölcsönszerződésekhez minősített elektronikus aláírás (QES) szükséges.";
  }

  // Employment contracts require AES
  if (
    cat.includes("munka") ||
    title.includes("munkaszerződés") ||
    title.includes("munkaszerzodes")
  ) {
    return "Munkaszerződésekhez fokozott biztonságú elektronikus aláírás (AES) szükséges a Ptk. 6:7. § (3) bekezdése szerint.";
  }

  return null;
}
