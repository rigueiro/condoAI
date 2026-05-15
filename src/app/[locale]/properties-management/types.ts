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
};

export type SortConfig = {
  key: keyof Property;
  direction: "asc" | "desc";
};
