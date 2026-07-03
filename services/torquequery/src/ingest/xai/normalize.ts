import { CicDocPage, CicSearchResult } from "./types";

export function normalizeSearch(result: any): CicSearchResult[] {
  const data = result?.data ?? result;
  const rawItems = Array.isArray(data?.items) 
    ? data.items 
    : Array.isArray(data?.content) 
      ? data.content 
      : Array.isArray(data)
        ? data
        : [];

  return rawItems.map((item: any) => ({
    slug: String(item.slug || ""),
    title: String(item.title || item.slug || ""),
    snippet: typeof item.snippet === "string" 
      ? item.snippet 
      : typeof item.preview === "string" 
        ? item.preview 
        : undefined,
  }));
}

export function normalizePage(result: any): CicDocPage {
  const data = result?.data ?? result;
  const item = data?.item || data?.content || data || {};
  return {
    slug: String(item.slug || ""),
    title: String(item.title || item.slug || ""),
    content: String(item.content || item.text || ""),
    url: typeof item.url === "string" ? item.url : undefined,
  };
}
