import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE =
  "d:\\Яндекс\\Yandex.Disk\\ИНТЕХ-АТОМ\\Методики расчетов\\ИНСТРУКЦИИ";
const API = "http://localhost:3001/api";

const ITEMS = [
  {
    file: "ИН № 1 допускаемые напряжения.docx",
    title: "ИН № 1 — Допускаемые напряжения",
    description: "Определение допускаемых напряжений для элементов сосудов и аппаратов",
    tags: "ИНТЕХ-АТОМ,инструкция,допускаемые напряжения,ПНАЭ,ГОСТ Р 52857.1",
  },
  {
    file: "ИН № 2 прибавка к толщине стенки.docx",
    title: "ИН № 2 — Прибавка к толщине стенки",
    description: "Расчёт прибавок к толщине стенки (коррозия, технологические)",
    tags: "ИНТЕХ-АТОМ,инструкция,прибавка,толщина стенки",
  },
  {
    file: "ИН № 3 цилиндрические обечайки.docx",
    title: "ИН № 3 — Цилиндрические обечайки",
    description: "Расчёт толщины цилиндрических обечаек при внутреннем и наружном давлении",
    tags: "ИНТЕХ-АТОМ,инструкция,обечайка,цилиндр,ГОСТ Р 52857.1",
  },
  {
    file: "ИН № 4 конические обечайки.docx",
    title: "ИН № 4 — Конические обечайки",
    description: "Расчёт конических обечаек и переходов",
    tags: "ИНТЕХ-АТОМ,инструкция,обечайка,конус",
  },
  {
    file: "ИН № 5 эллиптическое торосферическое днища.docx",
    title: "ИН № 5 — Эллиптическое и торосферическое днища",
    description: "Расчёт эллиптических и торосферических днищ",
    tags: "ИНТЕХ-АТОМ,инструкция,днище,эллиптическое,торосферическое",
  },
  {
    file: "ИН № 6 полусферическое днище.docx",
    title: "ИН № 6 — Полусферическое днище",
    description: "Расчёт полусферических днищ",
    tags: "ИНТЕХ-АТОМ,инструкция,днище,полусферическое",
  },
  {
    file: "ИН № 7 цилиндр коллектор штуцер труба.docx",
    title: "ИН № 7 — Цилиндр, коллектор, штуцер, труба",
    description: "Расчёт цилиндров, коллекторов, штуцеров и труб",
    tags: "ИНТЕХ-АТОМ,инструкция,штуцер,патрубок,труба,коллектор",
  },
  {
    file: "ИН № 8 колено.docx",
    title: "ИН № 8 — Колено",
    description: "Расчёт колен и изогнутых элементов",
    tags: "ИНТЕХ-АТОМ,инструкция,колено",
  },
  {
    file: "ИН № 9 круглые плоские днища крышки.docx",
    title: "ИН № 9 — Круглые плоские днища и крышки",
    description: "Расчёт плоских круглых днищ и крышек",
    tags: "ИНТЕХ-АТОМ,инструкция,днище,плоское,крышка",
  },
  {
    file: "ИН № 10 коэф снижения прочности.docx",
    title: "ИН № 10 — Коэффициент снижения прочности",
    description: "Коэффициенты снижения прочности в соединениях и отверстиях",
    tags: "ИНТЕХ-АТОМ,инструкция,коэффициент,прочность",
  },
];

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

async function upload(token, item) {
  const filePath = path.join(BASE, item.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([buffer]), item.file);
  form.append("title", item.title);
  form.append("description", item.description);
  form.append("tags", item.tags);
  form.append("version", "1.0");
  form.append("published", "true");

  const res = await fetch(`${API}/methodologies`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data.item;
}

const token = await login();
console.log("Logged in as admin\n");

const results = [];
for (const item of ITEMS) {
  try {
    const created = await upload(token, item);
    console.log(`OK  ${item.title} → /methodologies/${created.slug}`);
    results.push({ ok: true, title: item.title, slug: created.slug });
  } catch (err) {
    console.error(`FAIL ${item.title}: ${err.message}`);
    results.push({ ok: false, title: item.title, error: err.message });
  }
}

const ok = results.filter((r) => r.ok).length;
console.log(`\nDone: ${ok}/${ITEMS.length} uploaded`);
if (ok < ITEMS.length) process.exit(1);
