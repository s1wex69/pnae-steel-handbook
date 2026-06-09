import { Router } from "express";
import { query } from "../db/pool.js";
import { calculateById } from "../services/calculatorEngine.js";

export const calculatorsRouter = Router();

calculatorsRouter.get("/", async (_req, res) => {
  const result = await query(
    `SELECT id, title, description, standard, enabled, sort_order
     FROM calculators ORDER BY sort_order`
  );
  res.json({ items: result.rows });
});

calculatorsRouter.post("/:id/calculate", (req, res) => {
  try {
    const data = calculateById(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка расчёта";
    const status = message.includes("не реализован") ? 404 : 400;
    res.status(status).json({ error: message });
  }
});

calculatorsRouter.get("/:id", async (req, res) => {
  const result = await query(
    `SELECT id, title, description, standard, enabled FROM calculators WHERE id = $1`,
    [req.params.id]
  );
  const item = result.rows[0];
  if (!item) return res.status(404).json({ error: "Калькулятор не найден" });
  res.json({ item });
});
