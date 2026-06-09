import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/pnae-steel-properties.xlsx"
);
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/xlsx-unzip");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${file.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" }
);

const wbPath = path.join(outDir, "xl", "workbook.xml");
const stringsPath = path.join(outDir, "xl", "sharedStrings.xml");
console.log("workbook exists", fs.existsSync(wbPath));
console.log("sharedStrings exists", fs.existsSync(stringsPath));

if (fs.existsSync(wbPath)) {
  const wb = fs.readFileSync(wbPath, "utf8");
  const sheets = [...wb.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
  console.log("Sheet names from workbook.xml:", sheets);
}

const worksheetsDir = path.join(outDir, "xl", "worksheets");
if (fs.existsSync(worksheetsDir)) {
  for (const f of fs.readdirSync(worksheetsDir)) {
    if (!f.endsWith(".xml")) continue;
    const xml = fs.readFileSync(path.join(worksheetsDir, f), "utf8");
    const rows = (xml.match(/<v>[^<]+<\/v>/g) || []).slice(0, 20);
    console.log(`\n${f} first values:`, rows.slice(0, 10));
  }
}

if (fs.existsSync(stringsPath)) {
  const s = fs.readFileSync(stringsPath, "utf8");
  const texts = [...s.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]);
  console.log("\nShared strings count:", texts.length);
  const jsonLike = texts.filter((t) => t.includes("{") && t.includes("}"));
  console.log("JSON-like strings:", jsonLike.length);
  if (jsonLike.length) {
    const longest = jsonLike.sort((a, b) => b.length - a.length)[0];
    fs.writeFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/extracted-json-preview.txt"),
      longest.slice(0, 5000),
      "utf8"
    );
    console.log("Wrote preview, length", longest.length);
  }
}
