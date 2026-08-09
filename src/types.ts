export type BuildingType =
    | "low-rise"
    | "mid-rise"
    | "high-rise"
    | "townhouse";

export type CondominiumStatus =
    | "active"
    | "inactive"
    | "under-construction";

export interface Condominium {
    id: string;
    name: string;
    address: {
        street: string;
        postalCode: string;
        parish: string;
        municipality: string;
    };
    taxId: string; // NIF
    deedDate: Date | string; // ISO string or Date
    propertyRegistryNumber: string;
    numberOfUnits: number;
    totalPermillage: number; // Always 1000
    commonAreas: string[]; // Ex.: ['elevators', 'garden']
    buildingType: BuildingType;
    status: CondominiumStatus;
    constitutiveTitle: string | null; // URL or path for PDF upload
    internalRegulations: {
        version: string;
        date: Date | string;
        file: string | null; // URL/path PDF
    };
}

export interface Unit {
    id: string;
    condominiumId: string;
    label: string; // Ex.: 'A-101'
    floor: string | null;
    permillage: number; // Fraction of Condominium.totalPermillage (sum = 1000)
    type: 'apartment' | 'shop' | 'garage' | 'parking' | 'other';
    areaSqm: number | null;
}

export interface Owner {
    id: string;
    fullName: string;
    contacts: {
        phone: string;
        email: string;
        mailingAddress: string | null;
    };
    taxId: string; // NIF
    unitId: string; // Reference to unit
    unitPermillage: number;
    monthlyQuota: number; // Auto-calculated
    type: 'owner' | 'tenant' | 'representative';
    documents: string[]; // Array of URLs/paths for uploads (power of attorney, etc.)
    entryDate: Date | string;
    exitDate: Date | string | null;
}

export interface AnnualBudget {
    id: string;
    condominiumId: string;
    year: number; // Ex.: 2025
    valuesByCategory: Record<string, number>; // Ex.: { 'cleaning': 1200, 'electricity': 800 }
    status: 'draft' | 'approved';
}

export interface BankAccount {
    id: string;
    condominiumId: string;
    bank: string;
    iban: string;
    currentBalance: number;
}

export interface QuotaPayment {
    id: string;
    ownerId: string;
    monthYear: string; // Ex.: '2025-01'
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    paymentDate: Date | string | null;
}

export interface Expense {
    id: string;
    condominiumId: string;
    date: Date | string;
    amount: number;
    category: string; // Ex.: 'maintenance', 'insurance'
    supplier: string;
    invoice: string | null; // URL/path PDF
}

export interface Equipment {
    id: string;
    condominiumId: string;
    type: string; // Ex.: 'elevator', 'water-pump'
    brand: string;
    installationDate: Date | string;
    location: string;
    status: 'operational' | 'maintenance' | 'broken';
}

export interface MaintenanceContract {
    id: string;
    condominiumId: string;
    company: string;
    service: string;
    monthlyValue: number;
    startDate: Date | string;
    endDate: Date | string | null;
    document: string | null; // URL/path PDF
}

export interface Intervention {
    id: string;
    condominiumId: string;
    date: Date | string;
    description: string;
    cost: number;
    company: string;
    photos: string[]; // Array of image URLs
}

export interface InsurancePolicy {
    id: string;
    condominiumId: string;
    insurer: string;
    number: string;
    coverages: string[]; // Ex.: ['fire', 'water-damage']
    insuredCapital: number;
    annualPremium: number;
    renewalDate: Date | string;
}

export interface Claim {
    id: string;
    policyId: string;
    date: Date | string;
    description: string;
    claimedAmount: number;
    paidAmount: number;
    documents: string[]; // URLs for reports
}

export interface AssemblyMinutes {
    id: string;
    condominiumId: string;
    date: Date | string;
    type: 'ordinary' | 'extraordinary';
    file: string | null; // URL/path PDF
    participants: string[]; // Owner IDs
}

export interface Summons {
    id: string;
    condominiumId: string;
    sentDate: Date | string;
    title: string;
    content: string;
    method: 'email' | 'mail';
    proof: string | null; // URL/path
}

export interface LegalProcess {
    id: string;
    condominiumId: string;
    number: string;
    description: string;
    status: 'ongoing' | 'resolved' | 'archived';
    documents: string[];
}

export interface Certificate {
    id: string;
    condominiumId: string;
    type: 'energy' | 'technical-inspection' | 'usage-license';
    validity: Date | string;
    file: string | null;
}

export type OccurrenceCategory =
    | "MAINTENANCE"
    | "NOISE"
    | "PARKING"
    | "PET"
    | "CLEANLINESS"
    | "SECURITY"
    | "LEAK_WATER_DAMAGE"
    | "ELEVATOR"
    | "COMMON_AREA"
    | "RULE_VIOLATION"
    | "OTHER";

/** Workflow status keys (also used as i18n keys under occurrences.states). */
export type OccurrenceStatus =
    | "Open"
    | "Acknowledged"
    | "InProgress"
    | "WaitingForResident"
    | "Scheduled"
    | "OnHold"
    | "Resolved"
    | "Closed"
    | "Cancelled"
    | "Rejected";

export type OccurrencePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface OccurrenceComment {
    id: string;
    author: string;
    message: string;
    createdAt: string; // ISO date
}

export interface Occurrence {
    id: string;
    condominiumId: string;
    ownerId: string | null;
    title: string;
    description: string;
    category: OccurrenceCategory;
    /** Free-text location (unit label, lobby, garage, etc.). */
    unit: string | null;
    dateTime: Date | string;
    status: OccurrenceStatus;
    priority: OccurrencePriority;
    assignedTo: string | null;
    photos: string[];
    comments: OccurrenceComment[];
    history: {
        action: string;
        date: Date | string;
        author: string;
    }[];
}

export interface Consumption {
    id: string;
    condominiumId: string;
    monthYear: string; // Ex.: '2025-12'
    type: 'water' | 'electricity' | 'gas';
    value: number;
    invoice: string | null;
}

export interface Security {
    id: string;
    condominiumId: string;
    accessCodes: string[]; // Ex.: gate codes
    depositKeys: string[]; // Descriptions
    videoSurveillance: {
        active: boolean;
        gdprCompliance: boolean;
    };
}

// Example interface for General Notes (flexible)
export interface Note {
    id: string;
    condominiumId: string;
    content: string;
    date: Date | string;
    attachments: string[];
}