export interface MockPayment {
  id: number;
  date: string;
  ownerName: string;
  property: string;
  propertyId?: string;
  unit: string;
  amount: number;
  paymentMethod: string;
  status: "completed" | "pending" | "failed" | "disputed";
  receiptNumber: string;
  timestamp: string;
}

export const mockPayments: MockPayment[] = [
  {
    id: 1,
    date: "2024-01-15",
    ownerName: "Jennifer Martinez",
    property: "Sunset Gardens Condominiums",
    propertyId: "1",
    unit: "4B",
    amount: 2500,
    paymentMethod: "Bank Transfer",
    status: "completed",
    receiptNumber: "RCP-2024-0115",
    timestamp: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    date: "2024-01-14",
    ownerName: "Michael Chen",
    property: "Riverside Towers",
    propertyId: "2",
    unit: "7A",
    amount: 2400,
    paymentMethod: "Credit Card",
    status: "completed",
    receiptNumber: "RCP-2024-0114",
    timestamp: "2024-01-14T15:45:00Z",
  },
  {
    id: 3,
    date: "2024-01-14",
    ownerName: "Sarah Williams",
    property: "Sunset Gardens Condominiums",
    propertyId: "1",
    unit: "2C",
    amount: 2000,
    paymentMethod: "Check",
    status: "pending",
    receiptNumber: "RCP-2024-0113",
    timestamp: "2024-01-13T09:15:00Z",
  },
  {
    id: 4,
    date: "2024-01-12",
    ownerName: "Robert Kim",
    property: "Metropolitan Heights",
    propertyId: "4",
    unit: "5B",
    amount: 2200,
    paymentMethod: "Bank Transfer",
    status: "completed",
    receiptNumber: "RCP-2024-0112",
    timestamp: "2024-01-12T14:20:00Z",
  },
  {
    id: 5,
    date: "2024-01-11",
    ownerName: "Lisa Thompson",
    property: "Green Valley Residences",
    propertyId: "3",
    unit: "1C",
    amount: 2800,
    paymentMethod: "Credit Card",
    status: "failed",
    receiptNumber: "RCP-2024-0111",
    timestamp: "2024-01-11T11:30:00Z",
  },
  {
    id: 6,
    date: "2024-01-10",
    ownerName: "David Wilson",
    property: "Riverside Towers",
    propertyId: "2",
    unit: "8A",
    amount: 1900,
    paymentMethod: "Bank Transfer",
    status: "disputed",
    receiptNumber: "RCP-2024-0110",
    timestamp: "2024-01-10T16:00:00Z",
  },
];
