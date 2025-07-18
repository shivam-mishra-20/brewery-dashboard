// src/lib/table.ts

/**
 * Extracts the raw tabledata param from a URL.
 */
export function extractRawTableData(url: string): string | null {
  const parsed = new URL(
    url,
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost"
  );
  return parsed.searchParams.get("tabledata");
}

/**
 * Full pipeline: extract, decode, decrypt.
 */
export function getTableNumberFromUrl(url: string): string {
  const raw = extractRawTableData(url);
  if (!raw) return "";
  const decoded = decodeURIComponent(raw);
  return decryptTableData(decoded);
}


function decryptTableData(decoded: string): string {
    throw new Error("Function not implemented.");
}
// (Don’t forget to import or define decryptTableData here)
