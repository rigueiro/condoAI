"use client";

import Select from "@/components/ui/select";
import type { Vendor } from "@/types";
import { vendorsForCondominium } from "./views";

export function VendorSelectField({
  vendors,
  condominiumId,
  value,
  onChange,
  label,
  emptyOptionLabel,
  noVendorsMessage,
  labelClassName = "mb-1 block text-sm font-medium text-text-primary",
}: {
  vendors: Vendor[];
  condominiumId: string;
  value: string;
  onChange: (vendorId: string, vendor: Vendor | null) => void;
  label: string;
  emptyOptionLabel: string;
  noVendorsMessage: string;
  labelClassName?: string;
}) {
  const condoVendors = vendorsForCondominium(vendors, condominiumId);

  return (
    <div>
      <label className={labelClassName}>{label}</label>
      {condoVendors.length === 0 ? (
        <p className="text-xs text-text-secondary">{noVendorsMessage}</p>
      ) : (
        <Select
          value={value}
          onChange={(e) => {
            const nextId = e.target.value;
            onChange(
              nextId,
              condoVendors.find((v) => v.id === nextId) ?? null,
            );
          }}
        >
          <option value="">{emptyOptionLabel}</option>
          {condoVendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
