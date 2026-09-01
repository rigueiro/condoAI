/** Client-local occurrence photo helpers (data URLs until a real upload API exists). */

export const MAX_OCCURRENCE_PHOTO_BYTES = 1024 * 1024;
export const MAX_OCCURRENCE_PHOTOS = 4;
export const OCCURRENCE_PHOTO_ACCEPT = "image/png,image/jpeg";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg"]);

const DATA_URL_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
] as const;

export type OccurrencePhotoError = "invalidType" | "tooLarge" | "tooMany";

export function isAllowedOccurrencePhoto(
  file: File,
): Exclude<OccurrencePhotoError, "tooMany"> | null {
  if (!ALLOWED_TYPES.has(file.type)) return "invalidType";
  if (file.size > MAX_OCCURRENCE_PHOTO_BYTES) return "tooLarge";
  return null;
}

function isPhotoDataUrl(value: string): boolean {
  return DATA_URL_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function dataUrlBytes(value: string): number {
  const comma = value.indexOf(",");
  if (comma === -1) return 0;
  return Math.floor(((value.length - comma - 1) * 3) / 4);
}

export function sanitizeOccurrencePhotos(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_OCCURRENCE_PHOTOS) {
    throw new Error("badRequest");
  }
  return raw.map((item) => {
    if (typeof item !== "string" || !isPhotoDataUrl(item)) {
      throw new Error("badRequest");
    }
    if (dataUrlBytes(item) > MAX_OCCURRENCE_PHOTO_BYTES) {
      throw new Error("badRequest");
    }
    return item;
  });
}
