import {
  addWorksIntervention,
  addWorksQuote,
  awardWorksQuote,
  cancelWorksProject,
  completeWorksProject,
  createWorksProject,
  deleteWorksIntervention,
  deleteWorksProject,
  deleteWorksQuote,
  getWorks,
  issueWorksExtraordinary,
  linkWorksAssembly,
  unlinkWorksAssembly,
  updateWorksProject,
} from "@/lib/server/works";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type {
  AddInterventionInput,
  AddWorksQuoteInput,
  CreateWorksProjectInput,
  IssueWorksQuotaInput,
  LinkAssemblyInput,
  UpdateWorksProjectInput,
  WorksState,
} from "@/lib/works/types";

type WorksPatchBody = {
  action?: string;
  id?: string;
  projectId?: string;
  quoteId?: string;
  interventionId?: string;
} & Partial<CreateWorksProjectInput> &
  Partial<UpdateWorksProjectInput> &
  Partial<AddWorksQuoteInput> &
  Partial<LinkAssemblyInput> &
  Partial<IssueWorksQuotaInput> &
  Partial<AddInterventionInput>;

const ACTIONS: Record<
  string,
  (email: string, body: WorksPatchBody) => WorksState | null
> = {
  create: (email, body) =>
    body.condominiumId && body.title
      ? createWorksProject(email, {
          condominiumId: body.condominiumId,
          title: body.title,
          description: body.description,
          category: body.category,
          location: body.location,
          notes: body.notes,
        })
      : null,
  update: (email, body) =>
    body.id
      ? updateWorksProject(email, {
          id: body.id,
          title: body.title,
          description: body.description,
          category: body.category,
          location: body.location,
          notes: body.notes,
        })
      : null,
  remove: (email, body) =>
    body.id ? deleteWorksProject(email, body.id) : null,
  addQuote: (email, body) =>
    body.projectId && body.vendorId
      ? addWorksQuote(email, {
          projectId: body.projectId,
          vendorId: body.vendorId,
          amount: body.amount ?? 0,
          description: body.description,
          receivedAt: body.receivedAt,
          validUntil: body.validUntil,
          document: body.document,
        })
      : null,
  removeQuote: (email, body) =>
    body.projectId && body.quoteId
      ? deleteWorksQuote(email, body.projectId, body.quoteId)
      : null,
  awardQuote: (email, body) =>
    body.projectId && body.quoteId
      ? awardWorksQuote(email, body.projectId, body.quoteId)
      : null,
  linkAssembly: (email, body) =>
    body.projectId && body.assemblyId && body.agendaItemId
      ? linkWorksAssembly(email, {
          projectId: body.projectId,
          assemblyId: body.assemblyId,
          agendaItemId: body.agendaItemId,
        })
      : null,
  unlinkAssembly: (email, body) =>
    body.projectId ? unlinkWorksAssembly(email, body.projectId) : null,
  issueExtraordinary: (email, body) =>
    body.projectId
      ? issueWorksExtraordinary(email, {
          projectId: body.projectId,
          description: body.description,
          totalAmount: body.totalAmount,
          date: body.date,
          dueDate: body.dueDate,
        })
      : null,
  addIntervention: (email, body) =>
    body.projectId && body.description
      ? addWorksIntervention(email, {
          projectId: body.projectId,
          date: body.date,
          description: body.description,
          cost: body.cost,
          vendorId: body.vendorId,
          company: body.company,
          photos: body.photos,
        })
      : null,
  removeIntervention: (email, body) =>
    body.interventionId
      ? deleteWorksIntervention(email, body.interventionId)
      : null,
  complete: (email, body) =>
    body.id ? completeWorksProject(email, body.id) : null,
  cancel: (email, body) =>
    body.id ? cancelWorksProject(email, body.id) : null,
};

export async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readOperations");
    return jsonOk({ state: getWorks(workspaceEmail) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeOperations");
    const body = (await request.json()) as WorksPatchBody;
    const next = body.action ? ACTIONS[body.action]?.(workspaceEmail, body) : null;
    return next ? jsonOk({ state: next }) : jsonError("badRequest");
  } catch (err) {
    return handleRouteError(err);
  }
}
