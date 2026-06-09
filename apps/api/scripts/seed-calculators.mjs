import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const calculators = [
  {
    id: "in-1-allowable-stress",
    title: "ИН № 1 — Допускаемые напряжения",
    description: "Номинальные допускаемые напряжения по ПНАЭ (7 режимов нагружения)",
    standard: "ПНАЭ Г-7-002-86",
    enabled: true,
    sort_order: 1,
  },
  {
    id: "in-2-wall-allowance",
    title: "ИН № 2 — Прибавка к толщине стенки",
    description: "Суммарная прибавка c₁ + c₂ + c₃",
    standard: "ГОСТ 19903-74 / ГОСТ 25347-82",
    enabled: true,
    sort_order: 2,
  },
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const keepIds = calculators.map((c) => c.id);

await pool.query("DELETE FROM calculators WHERE id <> ALL($1::text[])", [keepIds]);

for (const c of calculators) {
  await pool.query(
    `INSERT INTO calculators (id, title, description, standard, enabled, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       standard = EXCLUDED.standard,
       enabled = EXCLUDED.enabled,
       sort_order = EXCLUDED.sort_order`,
    [c.id, c.title, c.description, c.standard, c.enabled, c.sort_order]
  );
  console.log("OK", c.id);
}

await pool.end();
console.log("Only IN № 1 and IN № 2 calculators remain.");
