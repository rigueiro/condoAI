import type { Assembly } from "@/lib/assemblies/types";
import { DEMO_PDF } from "./demo-files";

export const mockAssemblies: Assembly[] = [
  {
    id: "asm1",
    condominiumId: "1",
    type: "ordinary",
    status: "summoned",
    title: "Assembleia ordinária 2026",
    scheduledDate: "2026-09-12",
    scheduledTime: "18:30",
    location: "Salão do rés-do-chão, Rua da Amoreira 45",
    call: 1,
    agenda: [
      {
        id: "asm1-i1",
        order: 1,
        title: "Prestação de contas de 2025",
        description: "Apreciar e votar o relatório e contas do exercício.",
        majority: "absolute-present",
      },
      {
        id: "asm1-i2",
        order: 2,
        title: "Orçamento ordinário de 2026",
        description: "Aprovar o orçamento e o fundo de reserva.",
        majority: "absolute-present",
      },
      {
        id: "asm1-i3",
        order: 3,
        title: "Eleição do administrador",
        description: "Nomear o administrador para o próximo mandato.",
        majority: "simple",
      },
    ],
    summons: {
      sentDate: "2026-08-20",
      method: "email",
      title: "Convocatória — assembleia ordinária 12 de setembro de 2026",
      content:
        "Convoca-se a assembleia de condóminos para o dia 12 de setembro de 2026, às 18:30, no salão do rés-do-chão.\n\nOrdem de trabalhos:\n1. Prestação de contas de 2025\n2. Orçamento ordinário de 2026\n3. Eleição do administrador\n\nNa falta de quórum, a assembleia reunirá em segunda convocatória 30 minutos depois, com os condóminos presentes.",
      proof: null,
      delivery: null,
    },
    attendance: [],
    votes: [],
    minutes: { text: "", file: null, recordedAt: null },
    resolutions: [],
  },
  {
    id: "asm2",
    condominiumId: "2",
    type: "ordinary",
    status: "in_session",
    title: "Assembleia ordinária Torre do Tejo",
    scheduledDate: "2026-08-25",
    scheduledTime: "19:00",
    location: "Sala de reuniões, Av. Infante Santo",
    call: 2,
    agenda: [
      {
        id: "asm2-i1",
        order: 1,
        title: "Seguro do edifício",
        description: "Renovar a apólice e o capital seguro.",
        majority: "absolute-present",
      },
      {
        id: "asm2-i2",
        order: 2,
        title: "Limpeza das partes comuns",
        description: "Adjudicar o contrato de limpeza para 2026/2027.",
        majority: "simple",
      },
    ],
    summons: {
      sentDate: "2026-08-10",
      method: "email",
      title: "Convocatória e ordem de trabalhos",
      content:
        "Assembleia ordinária em 25 de agosto de 2026, às 19:00.\n\n1. Seguro do edifício\n2. Limpeza das partes comuns",
      proof: null,
      delivery: null,
    },
    attendance: [
      {
        ownerId: "2",
        status: "present",
        representedByOwnerId: null,
      },
      {
        ownerId: "5",
        status: "represented",
        representedByOwnerId: "2",
      },
    ],
    votes: [
      {
        itemId: "asm2-i1",
        ballots: { "2": "for", "5": "for" },
      },
    ],
    minutes: { text: "", file: null, recordedAt: null },
    resolutions: [],
  },
  {
    id: "asm3",
    condominiumId: "4",
    type: "extraordinary",
    status: "closed",
    title: "Assembleia extraordinária — obras de fachada",
    scheduledDate: "2025-11-08",
    scheduledTime: "10:00",
    location: "Escritório da administração",
    call: 2,
    agenda: [
      {
        id: "asm3-i1",
        order: 1,
        title: "Obras de conservação da fachada",
        description:
          "Aprovar o caderno de encargos e o lançamento da quota extraordinária.",
        majority: "qualified-total",
      },
    ],
    summons: {
      sentDate: "2025-10-22",
      method: "mail",
      title: "Convocatória para deliberação sobre obras de conservação",
      content:
        "Assembleia extraordinária em 8 de novembro de 2025 para deliberar sobre as obras de fachada.",
      proof: null,
      delivery: null,
    },
    attendance: [
      {
        ownerId: "4",
        status: "present",
        representedByOwnerId: null,
      },
    ],
    votes: [
      {
        itemId: "asm3-i1",
        ballots: { "4": "for" },
      },
    ],
    minutes: {
      text: "Acta da assembleia ordinária de 2025 — prestação de contas aprovada por unanimidade.",
      file: DEMO_PDF,
      recordedAt: "2025-11-08",
    },
    resolutions: [
      {
        id: "res-asm3-i1",
        itemId: "asm3-i1",
        title: "Obras de conservação da fachada",
        text: "Aprovar o caderno de encargos e o lançamento da quota extraordinária.",
        forPermillage: 12,
        againstPermillage: 0,
        abstainPermillage: 0,
        passed: false,
      },
    ],
  },
  {
    id: "asm4",
    condominiumId: "1",
    type: "extraordinary",
    status: "draft",
    title: "Assembleia extraordinária — elevador",
    scheduledDate: "2026-10-15",
    scheduledTime: "18:00",
    location: "A definir",
    call: 1,
    agenda: [
      {
        id: "asm4-i1",
        order: 1,
        title: "Substituição do elevador",
        description: "Aprovar a despesa e o modo de rateio.",
        majority: "qualified-total",
      },
    ],
    summons: null,
    attendance: [],
    votes: [],
    minutes: { text: "", file: null, recordedAt: null },
    resolutions: [],
  },
  {
    id: "asm5",
    condominiumId: "1",
    type: "extraordinary",
    status: "closed",
    title: "Assembleia extraordinária — impermeabilização da cobertura",
    scheduledDate: "2026-06-02",
    scheduledTime: "18:30",
    location: "Salão do rés-do-chão, Rua da Amoreira 45",
    call: 1,
    agenda: [
      {
        id: "asm5-i1",
        order: 1,
        title: "Obras de impermeabilização da cobertura",
        description:
          "Aprovar a cotação da Obras Amoreira Lda. e o lançamento da quota extraordinária.",
        majority: "qualified-total",
      },
    ],
    summons: {
      sentDate: "2026-05-18",
      method: "email",
      title: "Convocatória — obras da cobertura",
      content:
        "Assembleia extraordinária em 2 de junho de 2026 para deliberar sobre a impermeabilização da cobertura e a quota extraordinária.",
      proof: null,
      delivery: null,
    },
    attendance: [
      {
        ownerId: "1",
        status: "present",
        representedByOwnerId: null,
      },
    ],
    votes: [
      {
        itemId: "asm5-i1",
        ballots: { "1": "for" },
      },
    ],
    minutes: {
      text: "A assembleia aprovou a cotação da Obras Amoreira Lda. e o lançamento da quota extraordinária por permilagem.",
      file: DEMO_PDF,
      recordedAt: "2026-06-02",
    },
    resolutions: [
      {
        id: "res-asm5-i1",
        itemId: "asm5-i1",
        title: "Obras de impermeabilização da cobertura",
        text: "Aprovar a cotação da Obras Amoreira Lda. e o lançamento da quota extraordinária.",
        forPermillage: 42.5,
        againstPermillage: 0,
        abstainPermillage: 0,
        passed: true,
      },
    ],
  },
];
