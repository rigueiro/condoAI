'use server'

import { createExpense } from '@/modules/finance/expense.service'

interface Expense  {
    condoId: string;
    category: string;
    provider: string;
    value: number
}

export async function createExpenseAction(data: Expense) {
    return createExpense(data)
}