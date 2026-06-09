import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const handbooksRouter = Router();

const DATA_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../web/public/data/pnae-steel-properties.json"
);

let cache: { grades: { name: string; mark: string | null; classId: string }[] } | null = null;

async function loadSteel() {
  if (cache) return cache;
  const raw = await fs.readFile(DATA_PATH, "utf8");
  cache = JSON.parse(raw) as typeof cache;
  return cache!;
}

handbooksRouter.get("/steel/search", async (req, res) => {
  const q = (req.query.q as string)?.trim().toLowerCase();
  if (!q || q.length < 2) return res.json({ items: [] });
  const data = await loadSteel();
  const items = data.grades
    .filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.mark?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, 8)
    .map((g) => ({
      type: "handbook" as const,
      id: "pnae-steel",
      title: g.mark ?? g.name,
      description: g.name,
      classId: g.classId,
    }));
  res.json({ items });
});
