const FORMULA_PREFIX = /^[\\s]*[=+@-]/;

function csvCell(value) {
  let text = String(value ?? "");
  if (FORMULA_PREFIX.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function buildTransactionsCsv(transactions) {
  const rows = [
    ["Date", "Type", "Description", "Category", "Amount", "Currency"],
    ...transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.description,
      transaction.category,
      Number(transaction.amount).toFixed(2),
      transaction.currency || "TTD",
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\\r\\n") + "\\r\\n";
}
