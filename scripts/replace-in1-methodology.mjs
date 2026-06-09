import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const API = "http://localhost:3001/api";
const DOCX =
  process.argv[2] ||
  path.join(__dirname, "../data/in-1-dopuskaemye-napryazheniya.docx");

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@intech-atom.local",
      password: "admin123",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data.token;
}

async function listAll(token) {
  const res = await fetch(`${API}/methodologies?all=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.items || [];
}

async function deleteOne(token, slug) {
  const res = await fetch(`${API}/methodologies/${slug}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete ${slug} failed`);
  }
}

async function upload(token) {
  if (!fs.existsSync(DOCX)) {
    throw new Error(`File not found: ${DOCX}`);
  }
  const buffer = fs.readFileSync(DOCX);
  const form = new FormData();
  form.append("file", new Blob([buffer]), path.basename(DOCX));
  form.append("title", "ИН № 1 — Допускаемые напряжения");
  form.append(
    "description",
    "Определение допускаемых напряжений для элементов сосудов и аппаратов (актуальная редакция)"
  );
  form.append("tags", "ИНТЕХ-АТОМ,инструкция,допускаемые напряжения,ПНАЭ,ГОСТ Р 52857.1");
  form.append("version", "2.0");
  form.append("published", "true");

  const res = await fetch(`${API}/methodologies`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.item;
}

const token = await login();
console.log("Logged in\n");

const items = await listAll(token);
console.log(`Found ${items.length} methodologies, deleting…`);

for (const m of items) {
  await deleteOne(token, m.slug);
  console.log(`  deleted: ${m.slug}`);
}

const item = await upload(token);
console.log(`\nUploaded: ${item.title}`);
console.log(`URL: /methodologies/${item.slug}`);
