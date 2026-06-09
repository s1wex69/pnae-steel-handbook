import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db/pool.js";
import { config } from "../config.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
};

type PublicUser = Pick<DbUser, "id" | "email" | "name" | "role">;

function toPublicUser(user: PublicUser) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function signToken(user: PublicUser) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

const emailSchema = z.string().email("Некорректный email");
const passwordSchema = z.string().min(6, "Пароль не менее 6 символов");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().max(120).optional(),
});

const changeEmailSchema = z.object({
  newEmail: emailSchema,
  currentPassword: passwordSchema,
});

const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

async function findUserById(id: string): Promise<DbUser | undefined> {
  const result = await query<DbUser>("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

async function verifyPassword(user: DbUser, password: string) {
  return bcrypt.compare(password, user.password_hash);
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные регистрации" });
  }
  const { email, password, name } = parsed.data;
  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Пользователь с таким email уже существует" });
  }
  const password_hash = await bcrypt.hash(password, 10);
  const result = await query<PublicUser>(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, email, name, role`,
    [email, password_hash, name?.trim() || ""]
  );
  const user = result.rows[0]!;
  const token = signToken(user);
  res.status(201).json({ token, user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные" });
  }
  const { email, password } = parsed.data;
  const result = await query<DbUser>("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user || !(await verifyPassword(user, password))) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }
  const token = signToken(user);
  res.json({ token, user: toPublicUser(user) });
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res) => {
  const result = await query<PublicUser>(
    "SELECT id, email, name, role FROM users WHERE id = $1",
    [req.user!.sub]
  );
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  res.json({ user: toPublicUser(user) });
});

authRouter.patch("/email", authenticate, async (req: AuthRequest, res) => {
  const parsed = changeEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные" });
  }
  const { newEmail, currentPassword } = parsed.data;
  const user = await findUserById(req.user!.sub);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  if (!(await verifyPassword(user, currentPassword))) {
    return res.status(401).json({ error: "Неверный текущий пароль" });
  }
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    return res.status(400).json({ error: "Укажите новый email" });
  }
  const taken = await query("SELECT id FROM users WHERE email = $1 AND id <> $2", [
    newEmail,
    user.id,
  ]);
  if (taken.rows.length > 0) {
    return res.status(409).json({ error: "Этот email уже занят" });
  }
  const updated = await query<PublicUser>(
    `UPDATE users SET email = $1 WHERE id = $2
     RETURNING id, email, name, role`,
    [newEmail, user.id]
  );
  const row = updated.rows[0]!;
  const token = signToken(row);
  res.json({ token, user: toPublicUser(row) });
});

authRouter.patch("/password", authenticate, async (req: AuthRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Неверные данные" });
  }
  const { currentPassword, newPassword } = parsed.data;
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: "Новый пароль должен отличаться от текущего" });
  }
  const user = await findUserById(req.user!.sub);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  if (!(await verifyPassword(user, currentPassword))) {
    return res.status(401).json({ error: "Неверный текущий пароль" });
  }
  const password_hash = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [password_hash, user.id]);
  const token = signToken(user);
  res.json({
    token,
    user: toPublicUser(user),
    message: "Пароль изменён",
  });
});
