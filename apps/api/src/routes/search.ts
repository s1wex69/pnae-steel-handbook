import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "../db/pool.js";

export const searchRouter = Router();

const STEEL_JSON = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../web/public/data/pnae-steel-properties.json"
);

let steelGrades: { name: string; mark: string | null }[] | null = null;

async function searchSteel(q: string) {
  if (!steelGrades) {
    const raw = await fs.readFile(STEEL_JSON, "utf8");
    const data = JSON.parse(raw) as { grades: { name: string; mark: string | null }[] };
    steelGrades = data.grades;
  }
  const lower = q.toLowerCase();
  return steelGrades
    .filter(
      (g) => g.name.toLowerCase().includes(lower) || (g.mark?.toLowerCase().includes(lower) ?? false)
    )
    .slice(0, 5)
    .map((g) => ({
      type: "steel" as const,
      title: g.mark ?? g.name,
      description: g.name,
      href: `/handbooks/pnae-steel?q=${encodeURIComponent(g.mark ?? g.name)}`,
    }));
}

searchRouter.get("/", async (req, res) => {
  const q = (req.query.q as string)?.trim();
  if (!q || q.length < 2) {
    return res.json({ methodologies: [], calculators: [], steel: [] });
  }
  const pattern = `%${q}%`;
  const [methods, calcs, steel] = await Promise.all([
    query(
      `SELECT slug, title, description, 'methodology' as type
       FROM methodologies WHERE published = true AND (title ILIKE $1 OR description ILIKE $1)
       LIMIT 10`,
      [pattern]
    ),
    query(
      `SELECT id, title, description, 'calculator' as type, standard
       FROM calculators WHERE enabled = true AND (title ILIKE $1 OR description ILIKE $1)
       LIMIT 10`,
      [pattern]
    ),
    searchSteel(q).catch(() => []),
  ]);
  res.json({
    methodologies: methods.rows,
    calculators: calcs.rows,
    steel,
  });
});
