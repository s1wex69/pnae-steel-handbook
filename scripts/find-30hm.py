# -*- coding: utf-8 -*-
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
root = Path(__file__).resolve().parent.parent
text = (root / "data/xlsx-unzip/xl/worksheets/sheet12.xml").read_text(encoding="utf-8")
pattern = re.compile(
    r'\{Name:\s*"([^"]*)",ClassID:\s*"([^"]*)",'
    r"UltimateStressArray:\s*\[([^\]]*)\],"
    r"YieldStressArray:\s*\[([^\]]*)\]\},?"
)
rows = list(pattern.finditer(text))
print("json rows in sheet12:", len(rows))
for i, m in enumerate(rows):
    name = m.group(1)
    if "30ХМ" in name and "30ХМА" not in name:
        print(i, name[:80])
