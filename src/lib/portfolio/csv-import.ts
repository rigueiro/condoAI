import type { Owner, Unit } from "@/types";
import { parseUnitType } from "./units";

export const IMPORT_CSV_HEADERS = [
  "unitLabel",
  "floor",
  "permillage",
  "type",
  "areaSqm",
  "ownerName",
  "ownerTaxId",
  "email",
  "phone",
  "monthlyQuota",
] as const;

export type ImportCsvHeader = (typeof IMPORT_CSV_HEADERS)[number];

export interface ImportRowPreview {
  unitLabel: string;
  floor: string;
  permillage: number;
  type: string;
  areaSqm: number | null;
  ownerName: string;
  ownerTaxId: string;
  email: string;
  phone: string;
  monthlyQuota: number;
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: { row: number; field: string; message: string }[];
  warnings: string[];
  preview: ImportRowPreview[];
  units: Unit[];
  owners: Owner[];
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(splitCsvLine);
}

export function buildImportTemplateCsv(): string {
  const header = IMPORT_CSV_HEADERS.join(",");
  const sample = [
    "A-101",
    "1",
    "25.5",
    "apartment",
    "85",
    "Maria Silva",
    "123456789",
    "maria@example.com",
    "+351910000000",
    "120",
  ].join(",");
  return `${header}\n${sample}\n`;
}

/**
 * Parses and validates an owners/frações CSV for a given condominium.
 */
export function validateOwnersFractionsCsv(
  text: string,
  condominiumId: string,
): ImportValidationResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [
        {
          row: 0,
          field: "file",
          message: "emptyFile",
        },
      ],
      warnings: [],
      preview: [],
      units: [],
      owners: [],
    };
  }

  const header = rows[0].map((h) => h.trim());
  const missing = IMPORT_CSV_HEADERS.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: missing.map((field) => ({
        row: 1,
        field,
        message: "missingHeader",
      })),
      warnings: [],
      preview: [],
      units: [],
      owners: [],
    };
  }

  const index = Object.fromEntries(
    IMPORT_CSV_HEADERS.map((h) => [h, header.indexOf(h)]),
  ) as Record<ImportCsvHeader, number>;

  const errors: ImportValidationResult["errors"] = [];
  const preview: ImportRowPreview[] = [];
  const units: Unit[] = [];
  const owners: Owner[] = [];
  const ownerByTaxId = new Map<string, Owner>();
  let permillageSum = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const get = (key: ImportCsvHeader) => (row[index[key]] ?? "").trim();

    const unitLabel = get("unitLabel");
    const floor = get("floor");
    const permillageRaw = get("permillage");
    const typeRaw = get("type");
    const areaRaw = get("areaSqm");
    const ownerName = get("ownerName");
    const ownerTaxId = get("ownerTaxId");
    const email = get("email");
    const phone = get("phone");
    const quotaRaw = get("monthlyQuota");

    let rowOk = true;

    if (!unitLabel) {
      errors.push({ row: rowNum, field: "unitLabel", message: "required" });
      rowOk = false;
    }
    if (!ownerName) {
      errors.push({ row: rowNum, field: "ownerName", message: "required" });
      rowOk = false;
    }
    if (!ownerTaxId) {
      errors.push({ row: rowNum, field: "ownerTaxId", message: "required" });
      rowOk = false;
    }
    if (!email || !email.includes("@")) {
      errors.push({ row: rowNum, field: "email", message: "invalidEmail" });
      rowOk = false;
    }

    const permillage = Number(permillageRaw.replace(",", "."));
    if (!Number.isFinite(permillage) || permillage <= 0) {
      errors.push({
        row: rowNum,
        field: "permillage",
        message: "invalidNumber",
      });
      rowOk = false;
    }

    const monthlyQuota = Number(quotaRaw.replace(",", "."));
    if (!Number.isFinite(monthlyQuota) || monthlyQuota < 0) {
      errors.push({
        row: rowNum,
        field: "monthlyQuota",
        message: "invalidNumber",
      });
      rowOk = false;
    }

    const areaSqm =
      areaRaw === ""
        ? null
        : Number(areaRaw.replace(",", "."));
    if (areaSqm !== null && !Number.isFinite(areaSqm)) {
      errors.push({ row: rowNum, field: "areaSqm", message: "invalidNumber" });
      rowOk = false;
    }

    if (!rowOk) continue;

    const unitId = crypto.randomUUID();
    const unitType = parseUnitType(typeRaw);
    const taxKey = ownerTaxId.replace(/\s/g, "");
    let owner = ownerByTaxId.get(taxKey);
    if (!owner) {
      owner = {
        id: crypto.randomUUID(),
        fullName: ownerName,
        contacts: {
          phone: phone || "",
          email,
          mailingAddress: null,
        },
        taxId: ownerTaxId,
        monthlyQuota: 0,
        documents: [],
        entryDate: today,
        exitDate: null,
      };
      ownerByTaxId.set(taxKey, owner);
      owners.push(owner);
    }
    owner.monthlyQuota += monthlyQuota;

    units.push({
      id: unitId,
      condominiumId,
      label: unitLabel,
      floor: floor || null,
      permillage,
      type: unitType,
      areaSqm,
      occupancies: [{ ownerId: owner.id, role: "owner" }],
    });

    preview.push({
      unitLabel,
      floor,
      permillage,
      type: unitType,
      areaSqm,
      ownerName,
      ownerTaxId,
      email,
      phone,
      monthlyQuota,
    });

    permillageSum += permillage;
  }

  const warnings: string[] = [];
  if (preview.length > 0 && Math.abs(permillageSum - 1000) > 0.5) {
    warnings.push("permillageSum");
  }

  return {
    totalRows: rows.length - 1,
    validRows: preview.length,
    invalidRows: rows.length - 1 - preview.length,
    errors,
    warnings,
    preview,
    units,
    owners,
  };
}
