import type {
  AnnualBudget,
  AssemblyMinutes,
  BankAccount,
  Certificate,
  Condominium,
  Expense,
  InsurancePolicy,
  Owner,
  QuotaPayment,
  Summons,
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
    buildingType: "mid-rise",
    status: "active",
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
    buildingType: "high-rise",
    status: "active",
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
    buildingType: "low-rise",
    status: "active",
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
    buildingType: "high-rise",
    status: "active",
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
    buildingType: "townhouse",
    status: "active",
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
  {
    id: "b6",
    condominiumId: "1",
    year: 2027,
    valuesByCategory: {
      cleaning: 19_200,
      electricity: 15_600,
      insurance: 10_200,
      maintenance: 26_400,
      reserve: 13_200,
    },
    status: "draft",
  },
  {
    id: "b7",
    condominiumId: "2",
    year: 2027,
    valuesByCategory: {
      cleaning: 30_000,
      electricity: 22_800,
      insurance: 15_000,
      maintenance: 38_400,
      concierge: 25_200,
      reserve: 20_400,
    },
    status: "draft",
  },
];

/** Approved budgets for a calendar year (quota calc / condo stats). */
export function approvedBudgetsForYear(year = 2026): AnnualBudget[] {
  return mockAnnualBudgets.filter(
    (b) => b.status === "approved" && b.year === year,
  );
}

const annualTotalByCondoId = new Map(
  approvedBudgetsForYear().map((b) => [
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

/** Demo compliance spine — renewals + document history for the PT trust story. */
export const mockInsurancePolicies: InsurancePolicy[] = [
  {
    id: "ins1",
    condominiumId: "1",
    insurer: "Fidelidade",
    number: "AP-2024-88102",
    coverages: ["fire", "water-damage", "civil-liability"],
    insuredCapital: 4_200_000,
    annualPremium: 9_600,
    renewalDate: "2026-08-28",
  },
  {
    id: "ins2",
    condominiumId: "2",
    insurer: "Allianz",
    number: "MC-778421",
    coverages: ["fire", "water-damage", "earthquake"],
    insuredCapital: 8_500_000,
    annualPremium: 14_400,
    renewalDate: "2026-09-15",
  },
  {
    id: "ins3",
    condominiumId: "3",
    insurer: "Tranquilidade",
    number: "CS-45012",
    coverages: ["fire", "water-damage"],
    insuredCapital: 1_800_000,
    annualPremium: 3_600,
    renewalDate: "2026-11-01",
  },
  {
    id: "ins4",
    condominiumId: "4",
    insurer: "Fidelidade",
    number: "AP-2025-12044",
    coverages: ["fire", "water-damage", "civil-liability", "glass"],
    insuredCapital: 12_000_000,
    annualPremium: 19_200,
    renewalDate: "2026-07-20",
  },
  {
    id: "ins5",
    condominiumId: "5",
    insurer: "Zurich",
    number: "ZH-99210",
    coverages: ["fire", "water-damage"],
    insuredCapital: 2_400_000,
    annualPremium: 6_000,
    renewalDate: "2027-02-10",
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: "cert1",
    condominiumId: "1",
    type: "energy",
    validity: "2026-09-01",
    file: null,
  },
  {
    id: "cert2",
    condominiumId: "1",
    type: "technical-inspection",
    validity: "2027-03-15",
    file: null,
  },
  {
    id: "cert3",
    condominiumId: "2",
    type: "usage-license",
    validity: "2026-06-30",
    file: null,
  },
  {
    id: "cert4",
    condominiumId: "3",
    type: "energy",
    validity: "2025-12-01",
    file: null,
  },
  {
    id: "cert5",
    condominiumId: "4",
    type: "technical-inspection",
    validity: "2026-08-18",
    file: null,
  },
  {
    id: "cert6",
    condominiumId: "5",
    type: "usage-license",
    validity: "2028-01-20",
    file: null,
  },
];

export const mockAssemblyMinutes: AssemblyMinutes[] = [
  {
    id: "asm1",
    condominiumId: "1",
    date: "2026-03-12",
    type: "ordinary",
    file: null,
    participants: ["1", "2"],
  },
  {
    id: "asm2",
    condominiumId: "2",
    date: "2026-02-20",
    type: "ordinary",
    file: null,
    participants: ["3"],
  },
  {
    id: "asm3",
    condominiumId: "4",
    date: "2025-11-08",
    type: "extraordinary",
    file: null,
    participants: ["5"],
  },
  {
    id: "asm4",
    condominiumId: "3",
    date: "2025-09-30",
    type: "ordinary",
    file: null,
    participants: ["4"],
  },
];

export const mockSummons: Summons[] = [
  {
    id: "sum1",
    condominiumId: "1",
    sentDate: "2026-02-20",
    title: "Assembleia ordinária 2026",
    content: "Convocatória para assembleia ordinária de 12 de março de 2026.",
    method: "email",
    proof: null,
  },
  {
    id: "sum2",
    condominiumId: "2",
    sentDate: "2026-01-28",
    title: "Assembleia ordinária Torre do Tejo",
    content: "Convocatória e ordem de trabalhos enviadas aos condóminos.",
    method: "email",
    proof: null,
  },
  {
    id: "sum3",
    condominiumId: "4",
    sentDate: "2025-10-22",
    title: "Assembleia extraordinária — obras de fachada",
    content: "Convocatória para deliberação sobre obras de conservação.",
    method: "mail",
    proof: null,
  },
];

/** Demo condo finance — expenses + bank; budgets above feed quotas and /finance. */
export const mockBankAccounts: BankAccount[] = [
  {
    id: "ba1",
    condominiumId: "1",
    bank: "Millennium BCP",
    iban: "PT50 0033 0000 4550 1234 5678 9",
    currentBalance: 48_320,
  },
  {
    id: "ba2",
    condominiumId: "2",
    bank: "CGD",
    iban: "PT50 0035 0651 0000 9876 5432 1",
    currentBalance: 72_150,
  },
  {
    id: "ba3",
    condominiumId: "3",
    bank: "Novo Banco",
    iban: "PT50 0007 0000 1234 5678 9012 3",
    currentBalance: 18_940,
  },
  {
    id: "ba4",
    condominiumId: "4",
    bank: "Santander",
    iban: "PT50 0018 0003 4567 8901 2345 6",
    currentBalance: 95_600,
  },
  {
    id: "ba5",
    condominiumId: "5",
    bank: "ActivoBank",
    iban: "PT50 0023 0000 1111 2222 3333 4",
    currentBalance: 12_480,
  },
];

export const mockExpenses: Expense[] = [
  {
    id: "ex1",
    condominiumId: "1",
    date: "2026-07-08",
    amount: 1_450,
    category: "cleaning",
    supplier: "Limpeza Amoreira Lda.",
    invoice: null,
  },
  {
    id: "ex2",
    condominiumId: "1",
    date: "2026-07-15",
    amount: 890,
    category: "electricity",
    supplier: "EDP Comercial",
    invoice: null,
  },
  {
    id: "ex3",
    condominiumId: "1",
    date: "2026-06-22",
    amount: 2_400,
    category: "maintenance",
    supplier: "Elevadores Lisboa",
    invoice: null,
  },
  {
    id: "ex4",
    condominiumId: "2",
    date: "2026-07-02",
    amount: 2_100,
    category: "cleaning",
    supplier: "CleanPro Belém",
    invoice: null,
  },
  {
    id: "ex5",
    condominiumId: "2",
    date: "2026-07-18",
    amount: 1_800,
    category: "concierge",
    supplier: "Segurança Torre",
    invoice: null,
  },
  {
    id: "ex6",
    condominiumId: "3",
    date: "2026-05-30",
    amount: 620,
    category: "garden",
    supplier: "Jardins Cascais",
    invoice: null,
  },
  {
    id: "ex7",
    condominiumId: "4",
    date: "2026-07-10",
    amount: 3_200,
    category: "maintenance",
    supplier: "Fachadas Norte",
    invoice: null,
  },
  {
    id: "ex8",
    condominiumId: "5",
    date: "2026-06-14",
    amount: 480,
    category: "insurance",
    supplier: "Zurich",
    invoice: null,
  },
];
