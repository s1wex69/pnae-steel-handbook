# -*- coding: utf-8 -*-
"""Extract steel properties JSON from Excel sheet12 cached values."""
import json
import re
from pathlib import Path

xml_path = Path(__file__).resolve().parent.parent / "data/xlsx-unzip/xl/worksheets/sheet12.xml"
text = xml_path.read_text(encoding="utf-8")

# Cached formula results in AD column: {Name: "...",ClassID: "...", ...},
pattern = re.compile(
    r"\{Name:\s*\"([^\"]*)\",ClassID:\s*\"([^\"]*)\","
    r"UltimateStressArray:\s*\[([^\]]*)\],"
    r"YieldStressArray:\s*\[([^\]]*)\]\},?",
)

temps = [20, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600]

def parse_nums(s: str) -> list[float]:
    if not s.strip():
        return []
    return [float(x.strip()) for x in s.split(",") if x.strip()]


grades = []
for m in pattern.finditer(text):
    rm = parse_nums(m.group(3))
    rp = parse_nums(m.group(4))
    grades.append(
        {
            "name": m.group(1),
            "classId": m.group(2),
            "group": None,
            "rm": dict(zip(temps[: len(rm)], rm)),
            "rp02": dict(zip(temps[: len(rp)], rp)),
            "ultimateStressArray": rm,
            "yieldStressArray": rp,
            "temperatures": temps[: max(len(rm), len(rp))],
        }
    )

out = {
    "source": "ПНАЭ физмех свойства.xlsx",
    "standard": "ПНАЭ Г-7-002-86",
    "temperaturesC": temps,
    "grades": grades,
}

out_path = Path(__file__).resolve().parent.parent / "apps/web/public/data/pnae-steel-properties.json"
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Extracted {len(grades)} grades -> {out_path}")
