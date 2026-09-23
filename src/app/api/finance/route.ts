import type { AnnualBudget, BankAccount, Expense } from "@/types";
import {
  deleteAccount,
  deleteBudget,
  deleteExpense,
  getFinance,
  issueExtraordinaryQuota,
  markBudgetApproved,
  putAccount,
  putBudget,
  putExpense,
} from "@/lib/server/finance";
import { requireManagerAccess } from "@/lib/server/manager-access";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type { IssueExtraordinaryInput } from "@/lib/finance/types";
import { apiRoute } from "@/lib/server/api-route";

function hasCondoEntity<T extends { id?: string; condominiumId?: string }>(
  entity: T | undefined,
): entity is T & { id: string; condominiumId: string } {
  return Boolean(entity?.id && entity.condominiumId);
}

export const GET = apiRoute(async function GET() {
  try {
    const { workspaceEmail } = await requireManagerAccess("readFinance");
    return jsonOk({ state: getFinance(workspaceEmail) });
  } catch (err) {
    return handleRouteError(err);
  }
})

export const PATCH = apiRoute(async function PATCH(request: Request) {
  try {
    const { workspaceEmail } = await requireManagerAccess("writeFinance");
    const body = (await request.json()) as {
      action?: string;
      budget?: AnnualBudget;
      expense?: Expense;
      account?: BankAccount;
      id?: string;
      condominiumId?: string;
      description?: string;
      totalAmount?: number | string;
      date?: string;
      dueDate?: string;
    };

    switch (body.action) {
      case "upsertBudget":
        return hasCondoEntity(body.budget)
          ? jsonOk({ state: putBudget(workspaceEmail, body.budget) })
          : jsonError("badRequest");
      case "removeBudget":
        return body.id
          ? jsonOk({ state: deleteBudget(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "approveBudget":
        return body.id
          ? jsonOk({ state: markBudgetApproved(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "upsertExpense":
        return hasCondoEntity(body.expense)
          ? jsonOk({ state: putExpense(workspaceEmail, body.expense) })
          : jsonError("badRequest");
      case "removeExpense":
        return body.id
          ? jsonOk({ state: deleteExpense(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "upsertAccount":
        return hasCondoEntity(body.account)
          ? jsonOk({ state: putAccount(workspaceEmail, body.account) })
          : jsonError("badRequest");
      case "removeAccount":
        return body.id
          ? jsonOk({ state: deleteAccount(workspaceEmail, body.id) })
          : jsonError("badRequest");
      case "issueExtraordinary": {
        const extra: IssueExtraordinaryInput = {
          condominiumId: body.condominiumId ?? "",
          description: body.description ?? "",
          totalAmount: body.totalAmount ?? 0,
          date: body.date,
          dueDate: body.dueDate,
        };
        return extra.condominiumId && extra.description
          ? jsonOk({ state: issueExtraordinaryQuota(workspaceEmail, extra) })
          : jsonError("badRequest");
      }
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
})
