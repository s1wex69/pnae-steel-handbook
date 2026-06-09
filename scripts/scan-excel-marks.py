# -*- coding: utf-8 -*-
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
BASE = Path(__file__).resolve().parent.parent / "data/xlsx-unzip/xl"


def load_shared_strings() -> list[str]:
    root = ET.parse(BASE / "sharedStrings.xml").getroot()
    strings = []
    for si in root.findall("m:si", NS):
        parts = [t.text or "" for t in si.findall(".//m:t", NS)]
        strings.append("".join(parts))
    return strings


def col_to_idx(col: str) -> int:
    n = 0
    for c in col:
        n = n * 26 + (ord(c) - 64)
    return n - 1


def parse_sheet(sheet_path: Path, shared: list[str]) -> dict[tuple[int, int], str | float]:
    root = ET.parse(sheet_path).getroot()
    cells: dict[tuple[int, int], str | float] = {}
    for c in root.findall(".//m:c", NS):
        ref = c.get("r", "")
        m = re.match(r"([A-Z]+)(\d+)", ref)
        if not m:
            continue
        col, row = col_to_idx(m.group(1)), int(m.group(2)) - 1
        t = c.get("t")
        v_el = c.find("m:v", NS)
        if v_el is None or v_el.text is None:
            continue
        raw = v_el.text
        if t == "s":
            cells[(row, col)] = shared[int(raw)]
        elif t == "str":
            cells[(row, col)] = raw
        else:
            try:
                cells[(row, col)] = float(raw.replace(",", "."))
            except ValueError:
                cells[(row, col)] = raw
    return cells


shared = load_shared_strings()
for sheet in ["sheet2.xml", "sheet3.xml", "sheet13.xml"]:
    cells = parse_sheet(BASE / "worksheets" / sheet, shared)
    marks = {}
    for (row, col), val in cells.items():
        if col != 1:
            continue
        s = str(val)
        if s == "30ХМ":
            name = str(cells.get((row, 0), ""))
            sortament = str(cells.get((row, 2), ""))
            marks[row] = (name, sortament)
    print(f"\n{sheet}: 30ХМ rows = {len(marks)}")
    for row, (g, s) in sorted(marks.items())[:5]:
        print(f"  row {row+1}: group={g!r}, sort={s[:60]!r}")
