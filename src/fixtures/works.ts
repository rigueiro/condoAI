import type { WorksState } from "@/lib/works/types";
import { DEMO_PDF } from "./demo-files";

/** Demo obras pipeline — elevator quoting + approved roof job. */
export function mockWorksState(): WorksState {
  return {
    seqByYear: { "2026": 2 },
    projects: [
      {
        id: "works-elevator-1",
        number: "OB-2026-0001",
        condominiumId: "1",
        title: "Substituição do elevador",
        description:
          "Cabine e máquina no fim de vida útil. Recolher cotações e levar à assembleia extraordinária.",
        category: "elevator",
        location: "Caixa do elevador, bloco A",
        status: "pending_vote",
        quotes: [
          {
            id: "quote-el-1",
            vendorId: "vendor-1",
            amount: 48500,
            description: "Substituição completa, 8 semanas, garantia 2 anos.",
            receivedAt: "2026-08-12",
            validUntil: "2026-11-12",
            document: DEMO_PDF,
          },
          {
            id: "quote-el-2",
            vendorId: "vendor-4",
            amount: 51200,
            description: "Inclui andaime e protecção da caixa. 10 semanas.",
            receivedAt: "2026-08-18",
            validUntil: "2026-11-18",
            document: null,
          },
        ],
        awardedQuoteId: null,
        assemblyId: "asm4",
        agendaItemId: "asm4-i1",
        resolutionId: null,
        resolutionPassed: null,
        extraordinaryQuotaId: null,
        vendorId: null,
        notes: "Levar o caderno de encargos e as duas cotações à assembleia.",
        createdAt: "2026-07-20T10:00:00.000Z",
        updatedAt: "2026-08-18T16:00:00.000Z",
      },
      {
        id: "works-roof-1",
        number: "OB-2026-0002",
        condominiumId: "1",
        title: "Impermeabilização da cobertura",
        description:
          "Infiltrações no último piso. Assembleia aprovou o caderno de encargos e a quota extraordinária.",
        category: "roof",
        location: "Cobertura, último piso",
        status: "approved",
        quotes: [
          {
            id: "quote-roof-1",
            vendorId: "vendor-4",
            amount: 18600,
            description: "Membrana betuminosa, 240 m², 3 semanas.",
            receivedAt: "2026-05-04",
            validUntil: "2026-08-04",
            document: DEMO_PDF,
          },
          {
            id: "quote-roof-2",
            vendorId: "vendor-2",
            amount: 21400,
            description: "Inclui substituição de ralos e guarda.",
            receivedAt: "2026-05-09",
            validUntil: "2026-08-09",
            document: null,
          },
        ],
        awardedQuoteId: "quote-roof-1",
        assemblyId: "asm5",
        agendaItemId: "asm5-i1",
        resolutionId: "res-asm5-i1",
        resolutionPassed: true,
        extraordinaryQuotaId: null,
        vendorId: "vendor-4",
        notes: "Adjudicar Obras Amoreira. Lançar quota extraordinária após a acta.",
        createdAt: "2026-04-15T09:00:00.000Z",
        updatedAt: "2026-06-02T18:30:00.000Z",
      },
    ],
    interventions: [],
  };
}
