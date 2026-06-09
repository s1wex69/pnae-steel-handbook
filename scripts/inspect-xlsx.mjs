import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let XLSX;
try {
  XLSX = require("xlsx");
} catch {
  console.error("xlsx not installed");
  process.exit(1);
}

const file =
  process.argv[2] ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/pnae-steel-properties.xlsx");

const wb = XLSX.readFile(file);
console.log("Sheets:", wb.SheetNames);
for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  console.log(`\n=== ${name} (${rows.length} rows) ===`);
  console.log(rows.slice(0, 8));
}

const jsonSheet =
  wb.SheetNames.find((n) => /json/i.test(n)) || wb.SheetNames[wb.SheetNames.length - 1];
const jsonRows = XLSX.utils.sheet_to_json(wb.Sheets[jsonSheet], { header: 1 });
const textCells = jsonRows.flat().filter((c) => typeof c === "string" && c.trim().startsWith("{"));
if (textCells.length) {
  console.log("\n=== JSON cell preview ===");
  console.log(textCells[0].slice(0, 2000));
}
