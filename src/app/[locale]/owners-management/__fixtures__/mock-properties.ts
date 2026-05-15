export const mockProperties = [
  {
    id: "1",
    name: "Sunset Gardens Condominiums",
    address: "123 Maple Street, Downtown District, Metro City 12345",
    totalUnits: 48,
    occupiedUnits: 45,
    monthlyFeeRange: "$450 - $750",
    averageFee: 600,
    collectionRate: 94.2,
    amenities: ["Swimming Pool", "Gym", "Parking", "Security", "Garden"],
    buildingType: "High-rise",
    yearBuilt: 2018,
    status: "Active",
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    name: "Riverside Towers",
    address: "456 Oak Avenue, Riverside District, Metro City 12346",
    totalUnits: 72,
    occupiedUnits: 68,
    monthlyFeeRange: "$550 - $950",
    averageFee: 750,
    collectionRate: 97.1,
    amenities: ["Swimming Pool", "Gym", "Parking", "Security", "Concierge"],
    buildingType: "High-rise",
    yearBuilt: 2020,
    status: "Active",
    lastUpdated: "2024-01-14",
  },
  {
    id: "3",
    name: "Green Valley Residences",
    address: "789 Pine Road, Green Valley, Metro City 12347",
    totalUnits: 24,
    occupiedUnits: 22,
    monthlyFeeRange: "$350 - $550",
    averageFee: 450,
    collectionRate: 91.7,
    amenities: ["Parking", "Garden", "Playground"],
    buildingType: "Low-rise",
    yearBuilt: 2015,
    status: "Active",
    lastUpdated: "2024-01-13",
  },
  {
    id: "4",
    name: "Metropolitan Heights",
    address: "321 Cedar Lane, Business District, Metro City 12348",
    totalUnits: 96,
    occupiedUnits: 89,
    monthlyFeeRange: "$650 - $1200",
    averageFee: 925,
    collectionRate: 98.9,
    amenities: [
      "Swimming Pool",
      "Gym",
      "Parking",
      "Security",
      "Concierge",
      "Rooftop Terrace",
    ],
    buildingType: "High-rise",
    yearBuilt: 2022,
    status: "Active",
    lastUpdated: "2024-01-16",
  },
  {
    id: "5",
    name: "Lakeside Commons",
    address: "654 Birch Street, Lakeside, Metro City 12349",
    totalUnits: 36,
    occupiedUnits: 34,
    monthlyFeeRange: "$400 - $650",
    averageFee: 525,
    collectionRate: 88.9,
    amenities: ["Parking", "Garden", "Lake Access", "Security"],
    buildingType: "Mid-rise",
    yearBuilt: 2017,
    status: "Active",
    lastUpdated: "2024-01-12",
  },
] as {
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
}[];
