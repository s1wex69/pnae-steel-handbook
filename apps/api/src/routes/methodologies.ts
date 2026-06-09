import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";
import { query } from "../db/pool.js";
import { config } from "../config.js";
import {
  authenticate,
  optionalAuth,
  requireAdmin,
  type AuthRequest,
} from "../middleware/auth.js";
import {
  convertDocxToHtml,
  extractTocFromHtml,
  injectHeadingIds,
} from "../services/docxConverter.js";
import { slugify } from "../services/slugify.js";

export const methodologiesRouter = Router();

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = path.join(config.uploadDir, "methodologies");
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.endsWith(".docx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Только файлы .docx"));
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 },
});

methodologiesRouter.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const q = (req.query.q as string)?.trim();
  const tag = (req.query.tag as string)?.trim();
  const includeAll = req.query.all === "true" && req.user?.role === "admin";
  let sql = `SELECT id, slug, title, description, tags, version, published, created_at, updated_at
             FROM methodologies WHERE 1=1`;
  if (!includeAll) {
    sql += " AND published = true";
  }
  const params: unknown[] = [];
  if (q) {
    params.push(`%${q}%`);
    sql += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }
  if (tag) {
    params.push(tag);
    sql += ` AND $${params.length} = ANY(tags)`;
  }
  sql += " ORDER BY created_at DESC";
  const result = await query(sql, params);
  res.json({ items: result.rows });
});

methodologiesRouter.get("/:slug", async (req, res) => {
  const result = await query(
    `SELECT id, slug, title, description, html_content, tags, version,
            original_filename, created_at, updated_at
     FROM methodologies WHERE slug = $1 AND published = true`,
    [req.params.slug]
  );
  const item = result.rows[0];
  if (!item) return res.status(404).json({ error: "Методика не найдена" });
  const toc = extractTocFromHtml(item.html_content as string);
  res.json({ ...item, toc });
});

methodologiesRouter.get("/:slug/download", async (req, res) => {
  const result = await query<{ file_path: string; original_filename: string }>(
    "SELECT file_path, original_filename FROM methodologies WHERE slug = $1",
    [req.params.slug]
  );
  const item = result.rows[0];
  if (!item) return res.status(404).json({ error: "Файл не найден" });
  res.download(item.file_path, item.original_filename);
});

const uploadSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  tags: z.string().optional(),
  version: z.string().optional(),
  published: z.enum(["true", "false"]).optional(),
});

methodologiesRouter.post(
  "/",
  authenticate,
  requireAdmin,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Файл .docx обязателен" });
    }
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Неверные метаданные" });
    }
    const { title, description, tags, version, published } = parsed.data;
    let html = await convertDocxToHtml(req.file.path);
    html = injectHeadingIds(html);
    let slug = slugify(title);
    const existing = await query("SELECT slug FROM methodologies WHERE slug LIKE $1", [
      `${slug}%`,
    ]);
    if (existing.rows.length > 0) {
      slug = `${slug}-${existing.rows.length + 1}`;
    }
    const tagList = tags
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const result = await query(
      `INSERT INTO methodologies
       (slug, title, description, html_content, original_filename, file_path, tags, version, published, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, slug, title, version, created_at`,
      [
        slug,
        title,
        description ?? "",
        html,
        req.file.originalname,
        req.file.path,
        tagList,
        version ?? "1.0",
        published !== "false",
        req.user!.sub,
      ]
    );
    res.status(201).json({ item: result.rows[0] });
  }
);

methodologiesRouter.delete(
  "/:slug",
  authenticate,
  requireAdmin,
  async (req, res) => {
    const result = await query<{ file_path: string }>(
      "DELETE FROM methodologies WHERE slug = $1 RETURNING file_path",
      [req.params.slug]
    );
    const item = result.rows[0];
    if (!item) return res.status(404).json({ error: "Не найдено" });
    try {
      await fs.unlink(item.file_path);
    } catch {
      /* file may be missing */
    }
    res.json({ ok: true });
  }
);
