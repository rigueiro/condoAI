// import { on } from '@/lib/events'
// import { db } from '@/lib/db'
import { decideApproval } from './expense.rules'

/*on('financeiro.expense.created.v1', async (event) => {
    if (!decideApproval(event)) return

    await db.query(
        `UPDATE expenses
     SET status='APPROVED', auto_approved=true
     WHERE id=$1`,
        [event.expenseId]
    )
})*/