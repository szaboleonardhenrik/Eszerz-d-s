const LS_KEY = "favorite_templates";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
    return false;
  } else {
    favs.unshift(id);
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
    return true;
  }
}
