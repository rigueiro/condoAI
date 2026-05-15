// modules/finance/expense.service.ts
// import { db } from '@/lib/db'
// import { emit } from '@/lib/events'
// import { decideApproval } from './expense.rules'
import { v4 as uuid } from 'uuid'

export async function createExpense(input: {
    condoId: string
    category: string
    provider: string
    value: number
}) {
    const expenseId = uuid()

    /* await db.query(
        `INSERT INTO expenses (id, condo_id, category, provider, valor, status)
     VALUES ($1,$2,$3,$4,$5,'PENDING')`,
        [expenseId, input.condoId, input.category, input. provider, input.valor]
    )

    await emit('finance.expense.created.v1', {
        expenseId,
        ...input,
    }) */

    return { expenseId }
}
