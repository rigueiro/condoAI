export type CsvCell = string | number;

/**
 * Escapes a single CSV cell. Wraps values containing commas, quotes or
 * newlines in double quotes, and prefixes values that start with a formula
 * trigger (`=`, `+`, `-`, `@`) with a single quote to prevent CSV injection
 * when the file is opened in spreadsheet software.
 */
const escapeCsv = (value: CsvCell) => {
  let str = String(value ?? "");
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/**
 * Builds a CSV string from a header row and data rows. Prepends a UTF-8 BOM so
 * accented characters render correctly in Excel.
 */
export function buildCsv(headers: CsvCell[], rows: CsvCell[][]): string {
  const content = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
  return `\uFEFF${content}`;
}

/**
 * Builds a CSV from the given headers/rows and triggers a client-side download.
 */
export function downloadCsv(
  headers: CsvCell[],
  rows: CsvCell[][],
  filename: string,
): void {
  const blob = new Blob([buildCsv(headers, rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => window.URL.revokeObjectURL(url), 0);
}
