/**
 * Миграция БД без tsx (plain Node.js).
 * Запуск: npm run db:migrate -w apps/api
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { hashSync } from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const p of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../../.env"),
]) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://intech_atom:intech_atom@localhost:5432/intech_atom";

const migrations = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('guest', 'user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  html_content TEXT NOT NULL DEFAULT '',
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0',
  published BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculators (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  standard TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('methodology', 'calculator')),
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_methodologies_tags ON methodologies USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_methodologies_title ON methodologies (title);

INSERT INTO calculators (id, title, description, standard, enabled, sort_order) VALUES
  ('in-1-allowable-stress', 'ИН № 1 — Допускаемые напряжения', 'Номинальные допускаемые напряжения по ПНАЭ', 'ПНАЭ Г-7-002-86', true, 1),
  ('in-2-wall-allowance', 'ИН № 2 — Прибавка к толщине стенки', 'Суммарная прибавка c', 'ГОСТ 19903-74', true, 2)
ON CONFLICT (id) DO NOTHING;
`;

const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  const client = await pool.connect();
  try {
    await client.query(migrations);
    const adminExists = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@intech-atom.local"]
    );
    if (adminExists.rowCount === 0) {
      const hash = hashSync("admin123", 10);
      await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'admin')`,
        ["admin@intech-atom.local", hash, "Администратор"]
      );
      console.log("Created default admin: admin@intech-atom.local / admin123");
    }
    console.log("Migration completed.");
  } finally {
    client.release();
  }
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await pool.end();
}
