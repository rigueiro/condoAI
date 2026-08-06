/** Client-local document helpers (data URLs until a real upload API exists). */

export const MAX_COMPLIANCE_FILE_BYTES = 2 * 1024 * 1024;

export const COMPLIANCE_FILE_ACCEPT =
  "application/pdf,image/png,image/jpeg";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export type ComplianceFileError = "invalidType" | "tooLarge";

export function isAllowedComplianceFile(file: File): ComplianceFileError | null {
  if (!ALLOWED_TYPES.has(file.type)) return "invalidType";
  if (file.size > MAX_COMPLIANCE_FILE_BYTES) return "tooLarge";
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read-failed"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

export function mimeFromDataUrl(value: string): string | null {
  if (!value.startsWith("data:")) return null;
  const semi = value.indexOf(";");
  if (semi === -1) return null;
  return value.slice(5, semi) || null;
}

export function complianceFileLabel(value: string | null): string | null {
  if (!value) return null;
  const mime = mimeFromDataUrl(value);
  if (!mime) return "document";
  if (mime === "application/pdf") return "PDF";
  if (mime === "image/png") return "PNG";
  if (mime === "image/jpeg") return "JPEG";
  return "document";
}

export function openComplianceDocument(value: string): void {
  if (typeof window === "undefined") return;
  window.open(value, "_blank", "noopener,noreferrer");
}
