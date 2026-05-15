export function decideApproval(expense: {
    categoria: string
    valor: number
}) {
    return expense.valor <= 150
}