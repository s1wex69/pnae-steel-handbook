import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { methodologiesRouter } from "./routes/methodologies.js";
import { calculatorsRouter } from "./routes/calculators.js";
import { searchRouter } from "./routes/search.js";
import { handbooksRouter } from "./routes/handbooks.js";

async function main() {
  await fs.mkdir(config.uploadDir, { recursive: true });

  const app = express();
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/methodologies", methodologiesRouter);
  app.use("/api/calculators", calculatorsRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/handbooks", handbooksRouter);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ error: err.message || "Внутренняя ошибка сервера" });
    }
  );

  app.listen(config.port, () => {
    console.log(`API: http://localhost:${config.port}`);
  });
}

main().catch(console.error);
