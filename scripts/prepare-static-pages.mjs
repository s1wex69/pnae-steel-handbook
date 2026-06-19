/**
 * Сборка каталога public/ для GitHub Pages / GitLab Pages.
 * Использование: node scripts/prepare-static-pages.mjs github|gitlab
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2]?.trim();
if (target !== "github" && target !== "gitlab") {
  console.error("Укажите цель: github или gitlab");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostedRoot = path.join(root, "tilda-hosted");
const publicRoot = path.join(root, "public");
const urlsPath = path.join(root, "deploy", target, "urls.json");

const PROJECT_IDS = [
  "01-spravochnik",
  "02-kalkulyator-vnutrennee-davlenie",
  "03-kalkulyator-naruzhnoe-davlenie",
  "04-kalkulyator-polusfericheskoe-dnishche",
  "05-kalkulyator-ellipticheskoe-dnishche",
  "06-kalkulyator-torosfericheskoe-dnishche",
];

const DEFAULT_PATHS = {
  "01-spravochnik": "pnae",
  "02-kalkulyator-vnutrennee-davlenie": "calc1",
  "03-kalkulyator-naruzhnoe-davlenie": "calc2",
  "04-kalkulyator-polusfericheskoe-dnishche": "calc3",
  "05-kalkulyator-ellipticheskoe-dnishche": "calc4",
  "06-kalkulyator-torosfericheskoe-dnishche": "calc5",
};

const SKIP_FILES = new Set(["TILDA-ВСТАВКА.html", "README.txt"]);

async function loadPaths() {
  try {
    const raw = await readFile(urlsPath, "utf8");
    const data = JSON.parse(raw);
    return { ...DEFAULT_PATHS, ...(data.paths ?? {}) };
  } catch {
    return DEFAULT_PATHS;
  }
}

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_FILES.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else {
      await cp(from, to);
    }
  }
}

const paths = await loadPaths();

await rm(publicRoot, { recursive: true, force: true });
await mkdir(publicRoot, { recursive: true });

for (const id of PROJECT_IDS) {
  const src = path.join(hostedRoot, id);
  const segment = paths[id] ?? DEFAULT_PATHS[id];
  const dest = path.join(publicRoot, segment);

  try {
    await readdir(src);
  } catch {
    console.error(`Нет сборки: tilda-hosted/${id}/ — сначала npm run build:tilda:${target}`);
    process.exit(1);
  }

  await copyDir(src, dest);
  console.log(`OK: public/${segment}/ ← tilda-hosted/${id}/`);
}

const indexHtml = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ИНТЕХ-АТОМ — виджеты ПНАЭ</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; color: #1a2e2d; }
      h1 { font-size: 1.5rem; }
      ul { padding-left: 1.25rem; }
      a { color: #003837; }
      p.note { color: #4a5654; font-size: 0.95rem; }
    </style>
  </head>
  <body>
    <h1>ИНТЕХ-АТОМ — виджеты для Tilda</h1>
    <p class="note">Справочник и калькуляторы работают только во встроенном окне на intech-atom.ru.</p>
    <ul>
      <li><a href="./${paths["01-spravochnik"]}/">Справочник ПНАЭ</a></li>
      <li><a href="./${paths["02-kalkulyator-vnutrennee-davlenie"]}/">Калькулятор — внутреннее давление (обечайка)</a></li>
      <li><a href="./${paths["03-kalkulyator-naruzhnoe-davlenie"]}/">Калькулятор — наружное давление (обечайка)</a></li>
      <li><a href="./${paths["04-kalkulyator-polusfericheskoe-dnishche"]}/">Калькулятор — полусферическое днище</a></li>
      <li><a href="./${paths["05-kalkulyator-ellipticheskoe-dnishche"]}/">Калькулятор — эллиптическое днище</a></li>
      <li><a href="./${paths["06-kalkulyator-torosfericheskoe-dnishche"]}/">Калькулятор — торосферическое днище</a></li>
    </ul>
  </body>
</html>
`;

await writeFile(path.join(publicRoot, "index.html"), indexHtml, "utf8");
console.log(`\nГотово: public/ (${target} Pages)`);
