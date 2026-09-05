import {
  deleteBoardMandate,
  getBoard,
  recordBoardMandate,
  updateBoardMandate,
} from "@/lib/server/board";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type {
  BoardState,
  RecordMandateInput,
  SeatInput,
  UpdateMandateInput,
} from "@/lib/board/types";

type BoardPatchBody = {
  action?: string;
  id?: string;
  condominiumId?: string;
  startsOn?: string;
  endsOn?: string;
  seats?: SeatInput[];
  assemblyId?: string | null;
  agendaItemId?: string | null;
  resolutionId?: string | null;
  notes?: string;
};

const ACTIONS: Record<
  string,
  (email: string, body: BoardPatchBody) => BoardState | null
> = {
  record: (email, body) =>
    body.condominiumId && body.startsOn && body.endsOn && body.seats
      ? recordBoardMandate(email, {
          condominiumId: body.condominiumId,
          startsOn: body.startsOn,
          endsOn: body.endsOn,
          seats: body.seats,
          assemblyId: body.assemblyId,
          agendaItemId: body.agendaItemId,
          resolutionId: body.resolutionId,
          notes: body.notes,
        } satisfies RecordMandateInput)
      : null,
  update: (email, body) =>
    body.id
      ? updateBoardMandate(email, {
          id: body.id,
          startsOn: body.startsOn,
          endsOn: body.endsOn,
          seats: body.seats,
          notes: body.notes,
        } satisfies UpdateMandateInput)
      : null,
  remove: (email, body) =>
    body.id ? deleteBoardMandate(email, body.id) : null,
};

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readAssemblies");
    return jsonOk({ state: getBoard(workspaceEmail) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeAssemblies");
    const body = (await request.json()) as BoardPatchBody;
    const action = body.action ? ACTIONS[body.action] : undefined;
    if (!action) return jsonError("badRequest");
    const state = action(workspaceEmail, body);
    return state ? jsonOk({ state }) : jsonError("badRequest");
  } catch (err) {
    return handleRouteError(err);
  }
}
