/**
 * Сборка пакетов для деплоя на Amvera (после npm run build:tilda).
 * Копирует tilda-hosted/* в deploy/amvera/packages/<проект> + Dockerfile + amvera.yaml.
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostedRoot = path.join(root, "tilda-hosted");
const amveraRoot = path.join(root, "deploy", "amvera");
const packagesRoot = path.join(amveraRoot, "packages");

const PROJECT_IDS = [
  "01-spravochnik",
  "02-kalkulyator-vnutrennee-davlenie",
  "03-kalkulyator-naruzhnoe-davlenie",
];

const SKIP_FILES = new Set(["TILDA-ВСТАВКА.html", "README.txt"]);

const onlyArg = process.argv[2]?.trim();
const list = onlyArg
  ? PROJECT_IDS.filter((id) => id === onlyArg || id.includes(onlyArg))
  : PROJECT_IDS;

if (onlyArg && list.length === 0) {
  console.error(`Неизвестный проект: ${onlyArg}`);
  process.exit(1);
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

await mkdir(packagesRoot, { recursive: true });

for (const id of list) {
  const src = path.join(hostedRoot, id);
  const dest = path.join(packagesRoot, id);

  try {
    await readdir(src);
  } catch {
    console.error(`Нет сборки: tilda-hosted/${id}/ — сначала выполните npm run build:tilda`);
    process.exit(1);
  }

  await rm(dest, { recursive: true, force: true });
  await copyDir(src, dest);

  for (const file of ["Dockerfile", "nginx.conf", "amvera.yaml"]) {
    await cp(path.join(amveraRoot, file), path.join(dest, file));
  }

  console.log(`OK: deploy/amvera/packages/${id}/`);
}

const manifest = list
  .map((id) => `- ${id} → deploy/amvera/packages/${id}/`)
  .join("\n");

await writeFile(
  path.join(packagesRoot, "README.txt"),
  `Пакеты для Amvera (ИНТЕХ-АТОМ)
=============================

${manifest}

Каждая папка — отдельный проект в Amvera Cloud.
Подробная инструкция: deploy/amvera/ИНСТРУКЦИЯ.md

Пересборка:
  npm run build:tilda
  npm run prepare:amvera
`,
  "utf8"
);

console.log("\nГотово. Загрузите каждую папку из deploy/amvera/packages/ в отдельный проект Amvera.");
