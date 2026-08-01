import type {
  AnnualBudget,
  Condominium,
  Owner,
  QuotaPayment,
  Unit,
} from "@/types";
import { calculateMonthlyQuota, sumBudgetCategories } from "@/lib/quota";

export const mockCondominiums: Condominium[] = [
  {
    id: "1",
    name: "Condomínio Jardins da Amoreira",
    address: {
      street: "Rua da Amoreira 45",
      postalCode: "1250-096",
      parish: "Campo de Ourique",
      municipality: "Lisboa",
    },
    taxId: "509442013",
    deedDate: "2018-03-15",
    propertyRegistryNumber: "CRT-LX-2018-04521",
    numberOfUnits: 48,
    totalPermillage: 1000,
    commonAreas: ["elevators", "garden", "parking", "gym", "pool"],
    constitutiveTitle: null,
    internalRegulations: {
      version: "2.1",
      date: "2024-01-10",
      file: null,
    },
  },
  {
    id: "2",
    name: "Edifício Torre do Tejo",
    address: {
      street: "Avenida Brasília 120",
      postalCode: "1400-038",
      parish: "Belém",
      municipality: "Lisboa",
    },
    taxId: "514887291",
    deedDate: "2020-06-01",
    propertyRegistryNumber: "CRT-LX-2020-11803",
    numberOfUnits: 72,
    totalPermillage: 1000,
    commonAreas: ["elevators", "parking", "gym", "concierge", "security"],
    constitutiveTitle: null,
    internalRegulations: {
      version: "1.4",
      date: "2023-11-22",
      file: null,
    },
  },
  {
    id: "3",
    name: "Residências Vale Verde",
    address: {
      street: "Rua dos Pinheiros 18",
      postalCode: "2750-317",
      parish: "Cascais e Estoril",
      municipality: "Cascais",
    },
    taxId: "507331648",
    deedDate: "2015-09-20",
    propertyRegistryNumber: "CRT-CSC-2015-00914",
    numberOfUnits: 24,
    totalPermillage: 1000,
    commonAreas: ["parking", "garden", "playground"],
    constitutiveTitle: null,
    internalRegulations: {
      version: "1.0",
      date: "2015-10-01",
      file: null,
    },
  },
  {
    id: "4",
    name: "Metropolitan Avenida",
    address: {
      street: "Avenida dos Aliados 210",
      postalCode: "4000-065",
      parish: "Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória",
      municipality: "Porto",
    },
    taxId: "516203774",
    deedDate: "2022-02-14",
    propertyRegistryNumber: "CRT-PRT-2022-03301",
    numberOfUnits: 96,
    totalPermillage: 1000,
    commonAreas: [
      "elevators",
      "parking",
      "gym",
      "concierge",
      "rooftop",
      "security",
    ],
    constitutiveTitle: null,
    internalRegulations: {
      version: "1.2",
      date: "2024-03-05",
      file: null,
    },
  },
  {
    id: "5",
    name: "Quinta das Lagoas",
    address: {
      street: "Estrada da Circunvalação 88",
      postalCode: "4460-281",
      parish: "Senhora da Hora",
      municipality: "Matosinhos",
    },
    taxId: "508119356",
    deedDate: "2017-05-08",
    propertyRegistryNumber: "CRT-MTS-2017-07255",
    numberOfUnits: 36,
    totalPermillage: 1000,
    commonAreas: ["parking", "garden", "security", "lake-access"],
    constitutiveTitle: null,
    internalRegulations: {
      version: "1.1",
      date: "2022-06-18",
      file: null,
    },
  },
];

/** Seed units for owners currently shown in the UI (permillage sums toward 1000 per condo). */
export const mockUnits: Unit[] = [
  // Condo 1 — Jardins da Amoreira
  {
    id: "u1",
    condominiumId: "1",
    label: "A-101",
    floor: "1",
    permillage: 28,
    type: "apartment",
    areaSqm: 95,
  },
  {
    id: "u3",
    condominiumId: "1",
    label: "C-302",
    floor: "3",
    permillage: 22,
    type: "apartment",
    areaSqm: 78,
  },
  {
    id: "u6",
    condominiumId: "1",
    label: "B-101",
    floor: "1",
    permillage: 25,
    type: "apartment",
    areaSqm: 88,
  },
  // Condo 2 — Torre do Tejo
  {
    id: "u2",
    condominiumId: "2",
    label: "B-205",
    floor: "2",
    permillage: 18,
    type: "apartment",
    areaSqm: 110,
  },
  {
    id: "u5",
    condominiumId: "2",
    label: "A-205",
    floor: "2",
    permillage: 20,
    type: "apartment",
    areaSqm: 120,
  },
  // Condo 3 — Vale Verde
  {
    id: "u7",
    condominiumId: "3",
    label: "1C",
    floor: "1",
    permillage: 45,
    type: "apartment",
    areaSqm: 130,
  },
  // Condo 4 — Metropolitan Avenida
  {
    id: "u4",
    condominiumId: "4",
    label: "D-150",
    floor: "15",
    permillage: 12,
    type: "apartment",
    areaSqm: 145,
  },
];

export const mockAnnualBudgets: AnnualBudget[] = [
  {
    id: "b1",
    condominiumId: "1",
    year: 2026,
    valuesByCategory: {
      cleaning: 18_000,
      electricity: 14_400,
      insurance: 9_600,
      maintenance: 24_000,
      reserve: 12_000,
    },
    status: "approved",
  },
  {
    id: "b2",
    condominiumId: "2",
    year: 2026,
    valuesByCategory: {
      cleaning: 28_800,
      electricity: 21_600,
      insurance: 14_400,
      maintenance: 36_000,
      concierge: 24_000,
      reserve: 19_200,
    },
    status: "approved",
  },
  {
    id: "b3",
    condominiumId: "3",
    year: 2026,
    valuesByCategory: {
      cleaning: 7_200,
      electricity: 4_800,
      insurance: 3_600,
      maintenance: 9_600,
      garden: 4_800,
      reserve: 3_600,
    },
    status: "approved",
  },
  {
    id: "b4",
    condominiumId: "4",
    year: 2026,
    valuesByCategory: {
      cleaning: 36_000,
      electricity: 28_800,
      insurance: 19_200,
      maintenance: 48_000,
      concierge: 36_000,
      reserve: 28_800,
    },
    status: "approved",
  },
  {
    id: "b5",
    condominiumId: "5",
    year: 2026,
    valuesByCategory: {
      cleaning: 10_800,
      electricity: 7_200,
      insurance: 6_000,
      maintenance: 14_400,
      reserve: 7_200,
    },
    status: "approved",
  },
];

const annualTotalByCondoId = new Map(
  mockAnnualBudgets.map((b) => [
    b.condominiumId,
    sumBudgetCategories(b.valuesByCategory),
  ]),
);

const unitById = new Map(mockUnits.map((u) => [u.id, u]));

function monthlyQuotaForUnit(unit: Unit): number {
  return calculateMonthlyQuota(
    annualTotalByCondoId.get(unit.condominiumId) ?? 0,
    unit.permillage,
  );
}

type OwnerSeed = Omit<Owner, "unitPermillage" | "monthlyQuota"> & {
  unitId: string;
};

const ownerSeeds: OwnerSeed[] = [
  {
    id: "1",
    fullName: "Ana Sofia Martins",
    contacts: {
      phone: "+351 912 345 678",
      email: "ana.martins@email.pt",
      mailingAddress: null,
    },
    taxId: "234567890",
    unitId: "u1",
    type: "owner",
    documents: [],
    entryDate: "2023-03-15",
    exitDate: null,
  },
  {
    id: "2",
    fullName: "João Pedro Fernandes",
    contacts: {
      phone: "+351 923 456 789",
      email: "joao.fernandes@email.pt",
      mailingAddress: null,
    },
    taxId: "198765432",
    unitId: "u2",
    type: "owner",
    documents: [],
    entryDate: "2022-08-20",
    exitDate: null,
  },
  {
    id: "3",
    fullName: "Maria Clara Rodrigues",
    contacts: {
      phone: "+351 934 567 890",
      email: "maria.rodrigues@email.pt",
      mailingAddress: "Av. da República 100, 1050-191 Lisboa",
    },
    taxId: "267891234",
    unitId: "u3",
    type: "owner",
    documents: [],
    entryDate: "2023-11-10",
    exitDate: null,
  },
  {
    id: "4",
    fullName: "Carlos Manuel Sousa",
    contacts: {
      phone: "+351 945 678 901",
      email: "carlos.sousa@email.pt",
      mailingAddress: null,
    },
    taxId: "145678901",
    unitId: "u4",
    type: "owner",
    documents: [],
    entryDate: "2022-05-12",
    exitDate: null,
  },
  {
    id: "5",
    fullName: "Inês Beatriz Costa",
    contacts: {
      phone: "+351 956 789 012",
      email: "ines.costa@email.pt",
      mailingAddress: null,
    },
    taxId: "278901234",
    unitId: "u5",
    type: "owner",
    documents: [],
    entryDate: "2023-07-08",
    exitDate: null,
  },
  {
    id: "6",
    fullName: "Ricardo Jorge Almeida",
    contacts: {
      phone: "+351 967 890 123",
      email: "ricardo.almeida@email.pt",
      mailingAddress: null,
    },
    taxId: "156789012",
    unitId: "u6",
    type: "owner",
    documents: [],
    entryDate: "2022-12-01",
    exitDate: null,
  },
];

export const mockDomainOwners: Owner[] = ownerSeeds.map((seed) => {
  const unit = unitById.get(seed.unitId);
  if (!unit) {
    throw new Error(`Missing unit ${seed.unitId} for owner ${seed.id}`);
  }
  return {
    ...seed,
    unitPermillage: unit.permillage,
    monthlyQuota: monthlyQuotaForUnit(unit),
  };
});

export const mockQuotaPayments: QuotaPayment[] = [
  {
    id: "q1",
    ownerId: "1",
    monthYear: "2026-01",
    amount: mockDomainOwners[0].monthlyQuota,
    status: "overdue",
    paymentDate: null,
  },
  {
    id: "q2",
    ownerId: "1",
    monthYear: "2025-12",
    amount: mockDomainOwners[0].monthlyQuota,
    status: "paid",
    paymentDate: "2025-12-15",
  },
  {
    id: "q3",
    ownerId: "2",
    monthYear: "2026-02",
    amount: mockDomainOwners[1].monthlyQuota,
    status: "paid",
    paymentDate: "2026-02-01",
  },
  {
    id: "q4",
    ownerId: "3",
    monthYear: "2026-01",
    amount: mockDomainOwners[2].monthlyQuota,
    status: "pending",
    paymentDate: null,
  },
  {
    id: "q5",
    ownerId: "4",
    monthYear: "2026-02",
    amount: mockDomainOwners[3].monthlyQuota,
    status: "paid",
    paymentDate: "2026-02-05",
  },
  {
    id: "q6",
    ownerId: "5",
    monthYear: "2025-12",
    amount: mockDomainOwners[4].monthlyQuota,
    status: "overdue",
    paymentDate: null,
  },
  {
    id: "q7",
    ownerId: "6",
    monthYear: "2026-02",
    amount: mockDomainOwners[5].monthlyQuota,
    status: "paid",
    paymentDate: "2026-02-03",
  },
  {
    id: "q8",
    ownerId: "2",
    monthYear: "2026-01",
    amount: mockDomainOwners[1].monthlyQuota,
    status: "paid",
    paymentDate: "2026-01-14",
  },
  {
    id: "q9",
    ownerId: "4",
    monthYear: "2026-01",
    amount: mockDomainOwners[3].monthlyQuota,
    status: "paid",
    paymentDate: "2026-01-12",
  },
];
