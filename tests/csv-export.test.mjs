import test from "node:test";
import assert from "node:assert/strict";
import { buildTransactionsCsv, buildTransactionsCsvFileContent } from "../csv-export.mjs";

test("exports original transaction fields and currencies with CRLF rows", () => {
  const csv = buildTransactionsCsv([{ date: "2026-11-23", type: "expense", description: "Lunch", category: "Food", amount: 25.5, currency: "TTD" }]);
  assert.equal(csv, '"Date","Type","Description","Category","Amount","Currency"\r\n"2026-11-23","expense","Lunch","Food","25.50","TTD"\r\n');
});

test("quotes commas, quotes and actual line breaks", () => {
  const csv = buildTransactionsCsv([{ date: "2026-11-23", type: "income", description: 'Client, "paid"\nnow', category: "Work", amount: 10, currency: "USD" }]);
  assert.ok(csv.includes('"Client, ""paid""\nnow"'));
});

test("neutralises spreadsheet formula-like text fields, including whitespace prefixes", () => {
  const csv = buildTransactionsCsv([{ date: "2026-11-23", type: "expense", description: " =HYPERLINK(1)", category: "\t+SUM(A1:A2)", amount: 1, currency: "TTD" }]);
  assert.ok(csv.includes('"\' =HYPERLINK(1)"'));
  assert.ok(csv.includes('"\'\t+SUM(A1:A2)"'));
});

test("handles empty transaction lists with a CRLF-terminated header row", () => {
  assert.equal(buildTransactionsCsv([]), '"Date","Type","Description","Category","Amount","Currency"\r\n');
});

test("prefixes the exported file content with the actual UTF-8 BOM character", () => {
  const content = buildTransactionsCsvFileContent([]);
  assert.equal(content.charCodeAt(0), 0xFEFF);
  assert.ok(content.startsWith("\uFEFF"));
  assert.ok(content.includes('"Date","Type","Description","Category","Amount","Currency"'));
});
