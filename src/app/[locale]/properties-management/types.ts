export type Property = {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyFeeRange: string;
  averageFee: number;
  collectionRate: number;
  amenities: string[];
  buildingType: string;
  yearBuilt: number;
  status: string;
  lastUpdated: string;
  /** Condominium NIF (from domain) */
  taxId?: string;
  /** Always 1000 for Portuguese condos */
  totalPermillage?: number;
};

export type SortConfig = {
  key: "name" | "totalUnits" | "collectionRate" | "occupiedUnits" | "averageFee";
  direction: "asc" | "desc";
};
