import { Occurrence } from "../types";

export const mockOccurrences = [
  {
    id: "1",
    propertyId: "1",
    title: "Leak in bathroom ceiling",
    description: "",
    category: "Plumbing",
    unit: "22",
    reportedBy: "ze",
    reportedAt: "09/12/2025",
    state: "Open" as const,
    priority: "HIGH",
    assignedTo: "12345",
    photos: [],
    comments: [],
  },
] as Occurrence[];
