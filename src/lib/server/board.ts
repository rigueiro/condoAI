import { isDemoEmail } from "@/lib/auth/constants";
import { mockBoardState } from "@/fixtures/board";
import type { Assembly } from "@/lib/assemblies/types";
import {
  EMPTY_BOARD,
  type BoardState,
  type RecordMandateInput,
  type UpdateMandateInput,
} from "@/lib/board/types";
import {
  normalizeBoard,
  recordMandate,
  removeMandate,
  updateMandate,
} from "@/lib/board/storage";
import { currentMandate } from "@/lib/board/views";
import { defaultSigner } from "@/lib/board/rules";
import type { SummonsSigner } from "@/lib/assemblies/types";
import { getAssemblies } from "./assemblies";
import { getPortfolio } from "./portfolio";
import { readStore, writeStore } from "./store";

function loadOrSeed(email: string): {
  key: string;
  state: BoardState;
  seeded: boolean;
} {
  const key = email.trim().toLowerCase();
  const existing = readStore().board?.[key];
  if (existing) {
    return { key, state: normalizeBoard(existing), seeded: false };
  }
  if (isDemoEmail(key)) {
    return { key, state: normalizeBoard(mockBoardState()), seeded: true };
  }
  return { key, state: { ...EMPTY_BOARD }, seeded: false };
}

function persist(key: string, state: BoardState): void {
  const store = readStore();
  store.board = store.board ?? {};
  store.board[key] = state;
  writeStore(store);
}

export function getBoard(email: string): BoardState {
  const { key, state, seeded } = loadOrSeed(email);
  if (seeded) persist(key, state);
  return state;
}

function mutate(
  email: string,
  mutator: (current: BoardState) => BoardState,
): BoardState {
  const { key, state } = loadOrSeed(email);
  const next = normalizeBoard(mutator(state));
  persist(key, next);
  return next;
}

function condoContext(email: string, condominiumId: string) {
  const portfolio = getPortfolio(email);
  const condominium = portfolio.condominiums.find(
    (condo) => condo.id === condominiumId,
  );
  if (!condominium) throw new Error("condominiumNotFound");
  return {
    units: portfolio.units ?? [],
    owners: portfolio.owners ?? [],
    condominium,
  };
}

function assemblyFor(
  email: string,
  assemblyId: string | null | undefined,
): Assembly | null {
  if (!assemblyId) return null;
  return (
    getAssemblies(email).assemblies.find((row) => row.id === assemblyId) ??
    null
  );
}

export function recordBoardMandate(
  email: string,
  input: RecordMandateInput,
): BoardState {
  const ctx = condoContext(email, input.condominiumId);
  const assembly = assemblyFor(email, input.assemblyId);
  return mutate(email, (current) =>
    recordMandate(current, input, {
      units: ctx.units,
      assembly,
    }),
  );
}

export function updateBoardMandate(
  email: string,
  input: UpdateMandateInput,
): BoardState {
  const existing = getBoard(email).mandates.find((row) => row.id === input.id);
  if (!existing) throw new Error("mandateNotFound");
  const ctx = condoContext(email, existing.condominiumId);
  return mutate(email, (current) => updateMandate(current, input, ctx));
}

export function deleteBoardMandate(email: string, id: string): BoardState {
  return mutate(email, (current) => removeMandate(current, id));
}

export function resolveSummonsSigner(
  email: string,
  condominiumId: string,
  ownerId?: string | null,
): SummonsSigner {
  const firm: SummonsSigner = {
    ownerId: null,
    office: "administrador",
    name: null,
  };
  const portfolio = getPortfolio(email);
  const names = new Map(
    (portfolio.owners ?? []).map((owner) => [owner.id, owner.fullName]),
  );
  const mandate = currentMandate(getBoard(email).mandates, condominiumId);
  if (!mandate) return firm;

  const seat =
    (ownerId
      ? mandate.seats.find((row) => row.ownerId === ownerId)
      : null) ?? defaultSigner(mandate);
  if (!seat) return firm;

  return {
    ownerId: seat.ownerId,
    office: seat.office,
    name: names.get(seat.ownerId) ?? null,
  };
}
