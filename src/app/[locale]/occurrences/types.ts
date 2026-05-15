export enum OccurrenceState {
  Open = "OPEN", // Assigned or visible to staff/manager
  Acknowledged = "ACKNOWLEDGED", // Staff has replied or commented
  InProgress = "IN_PROGRESS", // Work has started (technician assigned, etc.)
  WaitingForResident = "WAITING_FOR_RESIDENT", // Need more info/photos/approval
  Scheduled = "SCHEDULED", // Work date/time is set
  OnHold = "ON_HOLD", // Waiting for parts, contractor, board approval, etc.
  Resolved = "RESOLVED", // Fixed/completed, waiting for resident confirmation
  Closed = "CLOSED", // Resident confirmed OK or auto-closed after X days
  Cancelled = "CANCELLED", // Duplicate, invalid, or withdrawn by resident
  Rejected = "REJECTED", // Not approved (e.g., not building's responsibility)
}

export enum OccurrenceCategory {
  Maintenance = "MAINTENANCE",
  Noise = "NOISE",
  Parking = "PARKING",
  Pet = "PET",
  Cleanliness = "CLEANLINESS",
  Security = "SECURITY",
  LeakWaterDamage = "LEAK_WATER_DAMAGE",
  Elevator = "ELEVATOR",
  CommonArea = "COMMON_AREA",
  RuleViolation = "RULE_VIOLATION",
  Other = "OTHER",
}

export enum OccurrencePriority {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH",
  Urgent = "URGENT", // e.g., flood, fire alarm, security breach
}

export enum ViolationStatus {
  Reported = "REPORTED",
  WarningIssued = "WARNING_ISSUED",
  FineIssued = "FINE_ISSUED",
  UnderReview = "UNDER_REVIEW",
  Appealed = "APPEALED",
  Resolved = "RESOLVED",
  Closed = "CLOSED",
}

export enum AmenityType {
  Gym = "GYM",
  Pool = "POOL",
  BBQ = "BBQ",
  PartyRoom = "PARTY_ROOM",
  GuestSuite = "GUEST_SUITE",
  Rooftop = "ROOFTOP",
  TennisCourt = "TENNIS_COURT",
  Other = "OTHER",
}

export enum PaymentStatus {
  Pending = "PENDING",
  Paid = "PAID",
  Overdue = "OVERDUE",
  Waived = "WAIVED",
  Refunded = "REFUNDED",
}

export enum AnnouncementType {
  General = "GENERAL",
  Emergency = "EMERGENCY",
  Maintenance = "MAINTENANCE",
  Event = "EVENT",
}

export interface Occurrence {
  id: string;
  name?: string;
  propertyId?: string;
  title: string; // e.g., "Leak in bathroom ceiling"
  description: string;
  category: string; // e.g., "Plumbing", "Noise Complaint", "Parking Violation"
  unit?: string; // Unit number or apartment ID
  reportedBy: string; // User ID or name
  reportedAt: string; // ISO date
  state: keyof typeof OccurrenceState;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string; // Staff/maintenance user ID
  photos?: string[]; // Array of image URLs
  comments?: Comment[]; // Internal + resident visible comments
}
