/**
 * Сборка проектов для Tilda.
 * - tilda-hosted/ — для загрузки на хостинг Tilda (НЕ вставлять index.html в блок HTML)
 * - в каждой папке: TILDA-ВСТАВКА.html — короткий код для блока T123
 */
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rename, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "apps", "web");
const hostedRoot = path.join(root, "tilda-hosted");
const jsonSrc = path.join(webDir, "public", "data", "pnae-steel-properties.json");
const amveraUrlsPath = path.join(root, "deploy", "amvera", "urls.json");

const NETLIFY_URLS = {
  "01-spravochnik": "https://intech-pnae.netlify.app/",
  "02-kalkulyator-vnutrennee-davlenie": "https://intech-calc1.netlify.app/",
  "03-kalkulyator-naruzhnoe-davlenie": "https://intech-calc2.netlify.app/",
};

const useNetlify = process.argv.includes("--netlify") || process.env.TILDA_IFRAME_HOST === "netlify";
const useGitlab = process.argv.includes("--gitlab") || process.env.TILDA_IFRAME_HOST === "gitlab";
const useGithub = process.argv.includes("--github") || process.env.TILDA_IFRAME_HOST === "github";
const onlyArg = process.argv.slice(2).find((a) => !a.startsWith("-"))?.trim();

const gitlabUrlsPath = path.join(root, "deploy", "gitlab", "urls.json");
const githubUrlsPath = path.join(root, "deploy", "github", "urls.json");

const GITLAB_URLS = {
  "01-spravochnik": "https://USERNAME.gitlab.io/PROJECT/pnae/",
  "02-kalkulyator-vnutrennee-davlenie": "https://USERNAME.gitlab.io/PROJECT/calc1/",
  "03-kalkulyator-naruzhnoe-davlenie": "https://USERNAME.gitlab.io/PROJECT/calc2/",
};

const GITHUB_URLS = {
  "01-spravochnik": "https://intechatom.github.io/pnae-steel-handbook/pnae/",
  "02-kalkulyator-vnutrennee-davlenie": "https://intechatom.github.io/pnae-steel-handbook/calc1/",
  "03-kalkulyator-naruzhnoe-davlenie": "https://intechatom.github.io/pnae-steel-handbook/calc2/",
};

function loadUrlsFromFile(filePath, defaults, placeholders) {
  return readFile(filePath, "utf8").then(
    (raw) => {
      const data = JSON.parse(raw);
      const urls = {};
      for (const id of Object.keys(defaults)) {
        const v = data[id]?.trim();
        if (v && !placeholders.some((p) => v.includes(p))) {
          urls[id] = v.endsWith("/") ? v : `${v}/`;
        } else {
          urls[id] = defaults[id];
        }
      }
      return urls;
    },
    () => defaults
  );
}

async function loadIframeUrls() {
  if (useNetlify) return NETLIFY_URLS;

  if (useGitlab) {
    return loadUrlsFromFile(gitlabUrlsPath, GITLAB_URLS, ["USERNAME", "PROJECT"]);
  }

  if (useGithub) {
    return loadUrlsFromFile(githubUrlsPath, GITHUB_URLS, ["USERNAME", "REPO"]);
  }

  try {
    const raw = await readFile(amveraUrlsPath, "utf8");
    const data = JSON.parse(raw);
    const urls = {};
    for (const id of Object.keys(NETLIFY_URLS)) {
      const v = data[id]?.trim();
      if (v && !v.includes("ВАШ_ЛОГИН")) {
        urls[id] = v.endsWith("/") ? v : `${v}/`;
      } else {
        urls[id] = NETLIFY_URLS[id];
      }
    }
    return urls;
  } catch {
    return NETLIFY_URLS;
  }
}

const iframeUrls = await loadIframeUrls();
const iframeHost = useNetlify
  ? "netlify"
  : useGitlab
    ? "gitlab (deploy/gitlab/urls.json)"
    : useGithub
      ? "github (deploy/github/urls.json)"
      : "amvera (deploy/amvera/urls.json)";
console.log(`Хостинг iframe: ${iframeHost}`);

const projects = [
  {
    id: "01-spravochnik",
    input: "tilda-handbook.html",
    title: "Справочник свойств сталей ПНАЭ",
    iframeTitle: "Справочник ПНАЭ",
    embedSiteUrl: "https://intech-atom.ru/pnae",
    embedSiteName: "ИНТЕХ-АТОМ",
  },
  {
    id: "02-kalkulyator-vnutrennee-davlenie",
    input: "tilda-calc-internal.html",
    title: "Калькулятор — внутреннее давление",
    iframeTitle: "Калькулятор — внутреннее давление",
    embedSiteUrl: "https://intech-atom.ru/calc1",
    embedSiteName: "ИНТЕХ-АТОМ",
  },
  {
    id: "03-kalkulyator-naruzhnoe-davlenie",
    input: "tilda-calc-external.html",
    title: "Калькулятор — наружное давление",
    iframeTitle: "Калькулятор — наружное давление",
    embedSiteUrl: "https://intech-atom.ru/calc2",
    embedSiteName: "ИНТЕХ-АТОМ",
  },
].map((p) => ({ ...p, iframeSrc: iframeUrls[p.id] }));

const buildList = onlyArg
  ? projects.filter((p) => p.id === onlyArg || p.id.includes(onlyArg))
  : projects;

if (onlyArg && buildList.length === 0) {
  console.error(`Неизвестный проект: ${onlyArg}`);
  console.error("Доступно:", projects.map((p) => p.id).join(", "));
  process.exit(1);
}

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

function embedSnippet(title, iframeSrc) {
  const src = iframeSrc ?? "ВСТАВЬТЕ_СЮДА_ССЫЛКУ_НА_index.html";
  return `<div style="width:100%;max-width:1200px;margin:0 auto;">
  <iframe
    src="${src}"
    title="${title}"
    style="width:100%;height:min(92vh,1400px);min-height:900px;border:0;border-radius:12px;"
    loading="lazy"
  ></iframe>
</div>
`;
}

await mkdir(hostedRoot, { recursive: true });

for (const project of buildList) {
  const outRel = path.join("..", "..", "tilda-hosted", project.id);
  console.log(`\n=== ${project.title} ===`);
  await run("npx", ["tsc", "-b"], {});
  await run("npx", ["vite", "build", "--config", "vite.tilda-hosted.config.ts"], {
    TILDA_INPUT: project.input,
    TILDA_OUT_DIR: outRel,
    VITE_EMBED_SITE_URL: project.embedSiteUrl ?? "https://intech-atom.ru/",
    VITE_EMBED_SITE_NAME: project.embedSiteName ?? "ИНТЕХ-АТОМ",
  });

  const projectDir = path.join(hostedRoot, project.id);
  const dataDir = path.join(projectDir, "data");
  await mkdir(dataDir, { recursive: true });
  await cp(jsonSrc, path.join(dataDir, "pnae-steel-properties.json"));

  const files = await readdir(projectDir);
  const html = files.find((f) => f.endsWith(".html") && f !== "index.html");
  if (html) {
    await rename(path.join(projectDir, html), path.join(projectDir, "index.html"));
  }

  await writeFile(
    path.join(projectDir, "TILDA-ВСТАВКА.html"),
    embedSnippet(project.iframeTitle, project.iframeSrc),
    "utf8"
  );

  console.log(`OK: tilda-hosted/${project.id}/`);
}

const readme = `Проекты для Tilda (ИНТЕХ-АТОМ)
================================

ПОЧЕМУ ОШИБКА «слишком много текста»?
------------------------------------
Блок T123 «HTML-код» на Tilda принимает только короткий фрагмент.
Файл index.html весит ~1,8 МБ — его НЕЛЬЗЯ вставлять в блок HTML.

В Tilda НЕТ загрузки папок с HTML (только картинки).
Нужен внешний хостинг + iframe.

ПРАВИЛЬНЫЙ СПОСОБ (хостинг Amvera — рекомендуется)
---------------------------------
1. npm run build:tilda:amvera
2. npm run prepare:amvera
3. Создайте 3 проекта в https://cloud.amvera.ru/ (см. deploy/amvera/ИНСТРУКЦИЯ.md)
4. Загрузите каждую папку deploy/amvera/packages/<проект>/ через Git или интерфейс
5. В Tilda обновите блок T123 кодом из TILDA-ВСТАВКА.html

Альтернатива — Netlify Drop: deploy/amvera/ИНСТРУКЦИЯ.md, раздел «Netlify».

Подробная инструкция: deploy/amvera/ИНСТРУКЦИЯ.md

Содержимое каждой папки
-----------------------
  index.html              — главная страница (загружать на хостинг, не в блок!)
  assets/                 — скрипты и стили (нужны рядом с index.html)
  data/pnae-steel-properties.json — база справочника
  TILDA-ВСТАВКА.html      — короткий код для блока Tilda

Пересборка
----------
npm run build:tilda
`;

await writeFile(path.join(hostedRoot, "README.txt"), readme, "utf8");
console.log("\nГотово. Используйте папку tilda-hosted/ и файлы TILDA-ВСТАВКА.html");
