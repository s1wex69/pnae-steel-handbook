/**
 * Сборка для вставки в блоки T123 Tilda (лимит ~100 КБ на блок).
 * Результат: tilda-t123/<проект>/блок-01.html … блок-N.html
 */
import { spawn } from "node:child_process";
import { gzipSync } from "node:zlib";
import { mkdir, readFile, writeFile, readdir, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { splitSingleFileHtml } from "./split-t123-blocks.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "apps", "web");
const outRoot = path.join(root, "tilda-t123");
const jsonPath = path.join(webDir, "public", "data", "pnae-steel-properties.json");

const projects = [
  {
    id: "01-spravochnik",
    input: "tilda-handbook.html",
    title: "Справочник свойств сталей ПНАЭ",
  },
  {
    id: "02-kalkulyator-vnutrennee-davlenie",
    input: "tilda-calc-internal.html",
    title: "Калькулятор — внутреннее давление",
  },
  {
    id: "03-kalkulyator-naruzhnoe-davlenie",
    input: "tilda-calc-external.html",
    title: "Калькулятор — наружное давление",
  },
];

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: webDir,
      env: { ...process.env, ...env },
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

function instructionText(project, blocks) {
  const visible = blocks.filter((b) => !b.hidden).length;
  const hidden = blocks.length - visible;
  const list = blocks
    .map((b) => {
      const tag = b.hidden ? "скрытый" : "ВИДИМЫЙ";
      return `  блок-${String(b.index).padStart(2, "0")}.html  (${b.bytes} байт, ${tag})`;
    })
    .join("\n");

  return `${project.title}
${"=".repeat(project.title.length)}

На Tilda блок T123 принимает не больше ~100 000 байт.
Код разбит на ${blocks.length} частей — вставьте их ПОДРЯД на одну страницу.

Шаги:
1. Откройте страницу в редакторе Tilda.
2. Добавьте блок T123 «HTML-код».
3. Скопируйте содержимое блок-01.html → вставьте в T123 → сохраните.
4. Снова добавьте T123 сразу ниже → блок-02.html → и так далее до блок-${String(blocks.length).padStart(2, "0")}.html.
5. Для блоков 02–${String(blocks.length).padStart(2, "0")} в настройках блока T123 отключите верхний/нижний отступ (если есть).
6. Опубликуйте страницу (код работает только после публикации).

Важно:
- Блоки должны идти строго по порядку (01, 02, 03…).
- Только блок-01 видимый — остальные ${hidden} служебные (скрыты внутри кода).
- Не меняйте и не объединяйте файлы.
- Справочник ПНАЭ встроен в блоки (сжат), внешний хостинг не нужен.

Файлы:
${list}
`;
}

await mkdir(outRoot, { recursive: true });

const jsonRaw = await readFile(jsonPath);
const dataB64 = gzipSync(jsonRaw).toString("base64");
console.log(`Справочник: JSON ${Math.round(jsonRaw.length / 1024)} КБ → gzip+base64 ${Math.round(dataB64.length / 1024)} КБ`);

for (const project of projects) {
  const buildDir = path.join(outRoot, "_build", project.id);
  const projectDir = path.join(outRoot, project.id);
  console.log(`\n=== ${project.title} ===`);

  await run("npx", ["tsc", "-b"], {});
  await run("npx", ["vite", "build", "--config", "vite.tilda-inline.config.ts"], {
    TILDA_INPUT: project.input,
    TILDA_OUT_DIR: path.join("..", "..", "tilda-t123", "_build", project.id),
  });

  await mkdir(projectDir, { recursive: true });
  const built = await readdir(buildDir);
  const htmlFile = built.find((f) => f.endsWith(".html"));
  if (!htmlFile) throw new Error(`Нет HTML в ${buildDir}`);
  const htmlPath = path.join(buildDir, htmlFile);
  if (htmlFile !== "index.html") {
    await rename(htmlPath, path.join(buildDir, "index.html"));
  }

  const html = await readFile(path.join(buildDir, "index.html"), "utf8");
  const blocks = splitSingleFileHtml(html, dataB64);

  for (const block of blocks) {
    const name = `блок-${String(block.index).padStart(2, "0")}.html`;
    await writeFile(path.join(projectDir, name), block.content, "utf8");
  }

  await writeFile(path.join(projectDir, "ИНСТРУКЦИЯ.txt"), instructionText(project, blocks), "utf8");

  const total = blocks.reduce((s, b) => s + b.bytes, 0);
  console.log(`OK: tilda-t123/${project.id}/ — ${blocks.length} блоков, всего ${Math.round(total / 1024)} КБ`);
}

const readme = `Проекты для блоков T123 Tilda
=============================

Лимит Tilda: ~100 000 байт на один блок T123.
Один файл не влезает — поэтому каждый проект разбит на несколько файлов блок-NN.html.

Сборка:
  npm run build:tilda-t123

Папки:
  01-spravochnik/
  02-kalkulyator-vnutrennee-davlenie/
  03-kalkulyator-naruzhnoe-davlenie/

В каждой папке откройте ИНСТРУКЦИЯ.txt и вставляйте блоки по порядку в T123.

Альтернатива (1 блок iframe): npm run build:tilda → папка tilda-hosted/
`;

await writeFile(path.join(outRoot, "README.txt"), readme, "utf8");
console.log("\nГотово: tilda-t123/");
