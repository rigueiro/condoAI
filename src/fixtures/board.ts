import type { BoardState } from "@/lib/board/types";

/** Jardins da Amoreira — current mandato from the 2025 ordinary election. */
export function mockBoardState(): BoardState {
  return {
    seqByYear: { "2025": 1 },
    mandates: [
      {
        id: "md-amoreira-2025",
        number: "MD-2025-0001",
        condominiumId: "1",
        startsOn: "2025-09-15",
        endsOn: "2026-09-14",
        assemblyId: "asm-board-2025",
        agendaItemId: "asm-board-2025-i3",
        resolutionId: "res-asm-board-2025-i3",
        seats: [
          {
            id: "md-amoreira-pres",
            ownerId: "3",
            office: "presidente",
            canSignSummons: true,
          },
          {
            id: "md-amoreira-sec",
            ownerId: "6",
            office: "secretario",
            canSignSummons: false,
          },
          {
            id: "md-amoreira-vog",
            ownerId: "1",
            office: "vogal",
            canSignSummons: false,
          },
        ],
        notes: "Eleita na assembleia ordinária de 15 de setembro de 2025.",
        supersededBy: null,
        createdAt: "2025-09-15T21:10:00.000Z",
        updatedAt: "2025-09-15T21:10:00.000Z",
      },
    ],
  };
}
