import { readFileSync, writeFileSync } from "node:fs";

const MARK_ALIASES = {
  "12X2M": "12Х2М",
  "12MX": "12МХ",
  "20X": "20Х",
  "40X": "40Х",
  "15ХНМФА-А": "15Х2НМФА-А",
};

function normalizeMark(mark) {
  if (!mark) return mark;
  let m = String(mark).trim();
  if (/^\d+\.0$/.test(m)) m = String(parseInt(m, 10));
  if (m.startsWith("Сплав ")) m = m.slice("Сплав ".length);
  return MARK_ALIASES[m] ?? m;
}

const paths = [
  "apps/web/public/data/pnae-steel-properties.json",
  "data/pnae-steel-properties.json",
];

for (const path of paths) {
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }

  let changed = 0;
  for (const grade of data.grades) {
    const next = normalizeMark(grade.mark);
    if (next !== grade.mark) {
      grade.mark = next;
      changed++;
    }
  }

  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  const marks = new Set(data.grades.map((g) => g.mark));
  console.log(`${path}: normalized ${changed} rows, ${marks.size} unique marks`);
}
