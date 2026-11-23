export type CreditGroup = {
  income: string;
  occupation: string;
  balance_brl: number;
  late_brl: number;
  late_pct: number | null;
  source_rows: number;
};

export const comparisonOccupations = [
  "MEI", "Autônomo", "Empregado de empresa privada", "Servidor ou empregado público",
];

export function occupationComparison(rows: CreditGroup[], income: string, all: boolean) {
  return rows.filter((row) => row.income === income && (all || comparisonOccupations.includes(row.occupation)))
    .sort((a, b) => (b.late_pct ?? -1) - (a.late_pct ?? -1));
}

export function balanceShare(rows: CreditGroup[], occupation: string): number | null {
  const total = rows.reduce((sum, row) => sum + row.balance_brl, 0);
  return total > 0 ? 100 * rows.filter((row) => row.occupation === occupation)
    .reduce((sum, row) => sum + row.balance_brl, 0) / total : null;
}
