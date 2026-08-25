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
import { requireSessionEmail } from "@/lib/server/session";
import { handleRouteError, jsonError, jsonOk } from "@/lib/server/http";
import type { IssueExtraordinaryInput } from "@/lib/finance/types";

function hasCondoEntity<T extends { id?: string; condominiumId?: string }>(
  entity: T | undefined,
): entity is T & { id: string; condominiumId: string } {
  return Boolean(entity?.id && entity.condominiumId);
}

export async function GET() {
  try {
    const email = await requireSessionEmail();
    return jsonOk({ state: getFinance(email) });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const email = await requireSessionEmail();
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
          ? jsonOk({ state: putBudget(email, body.budget) })
          : jsonError("badRequest");
      case "removeBudget":
        return body.id
          ? jsonOk({ state: deleteBudget(email, body.id) })
          : jsonError("badRequest");
      case "approveBudget":
        return body.id
          ? jsonOk({ state: markBudgetApproved(email, body.id) })
          : jsonError("badRequest");
      case "upsertExpense":
        return hasCondoEntity(body.expense)
          ? jsonOk({ state: putExpense(email, body.expense) })
          : jsonError("badRequest");
      case "removeExpense":
        return body.id
          ? jsonOk({ state: deleteExpense(email, body.id) })
          : jsonError("badRequest");
      case "upsertAccount":
        return hasCondoEntity(body.account)
          ? jsonOk({ state: putAccount(email, body.account) })
          : jsonError("badRequest");
      case "removeAccount":
        return body.id
          ? jsonOk({ state: deleteAccount(email, body.id) })
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
          ? jsonOk({ state: issueExtraordinaryQuota(email, extra) })
          : jsonError("badRequest");
      }
      default:
        return jsonError("badRequest");
    }
  } catch (err) {
    return handleRouteError(err);
  }
}
