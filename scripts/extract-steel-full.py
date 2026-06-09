# -*- coding: utf-8 -*-
"""Build full steel handbook from Excel worksheets (cached values)."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
BASE = Path(__file__).resolve().parent.parent / "data/xlsx-unzip/xl"
TEMPS = [20, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600]

MARK_ALIASES = {
    "12X2M": "12Х2М",
    "12MX": "12МХ",
    "20X": "20Х",
    "40X": "40Х",
    "15ХНМФА-А": "15Х2НМФА-А",
}


def normalize_mark(mark: str | float | None) -> str | None:
    if mark is None:
        return None
    m = str(mark).strip()
    if re.fullmatch(r"\d+\.0", m):
        m = str(int(float(m)))
    if m.startswith("Сплав "):
        m = m[len("Сплав ") :]
    return MARK_ALIASES.get(m, m)


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
    """Return {(row0-based, col0-based): value}"""
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
            is_el = c.find("m:is", NS)
            if is_el is not None:
                texts = [t_el.text or "" for t_el in is_el.findall(".//m:t", NS)]
                cells[(row, col)] = "".join(texts)
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


def row_series(cells: dict, row: int, col_start: int, length: int) -> list[float | None]:
    out: list[float | None] = []
    prev = None
    for i in range(length):
        v = cells.get((row, col_start + i))
        if v is None or v == "-":
            out.append(prev)
        elif isinstance(v, (int, float)):
            out.append(float(v))
            prev = float(v)
        elif isinstance(v, str) and v.replace(".", "", 1).isdigit():
            out.append(float(v))
            prev = float(v)
        else:
            out.append(prev)
    return out


def main():
    shared = load_shared_strings()
    rm_cells = parse_sheet(BASE / "worksheets/sheet2.xml", shared)
    rp_cells = parse_sheet(BASE / "worksheets/sheet3.xml", shared)
    a_cells = parse_sheet(BASE / "worksheets/sheet4.xml", shared)
    z_cells = parse_sheet(BASE / "worksheets/sheet5.xml", shared)
    alpha_cells = parse_sheet(BASE / "worksheets/sheet6.xml", shared)
    e_cells = parse_sheet(BASE / "worksheets/sheet7.xml", shared)

    # JSON sheet for names
    json_text = (BASE / "worksheets/sheet12.xml").read_text(encoding="utf-8")
    pattern = re.compile(
        r'\{Name:\s*"([^"]*)",ClassID:\s*"([^"]*)",'
        r"UltimateStressArray:\s*\[([^\]]*)\],"
        r"YieldStressArray:\s*\[([^\]]*)\]\},?"
    )
    json_rows = list(pattern.finditer(json_text))

    grades = []
    col_start = 3  # column D
    n_temps = len(TEMPS)

    for i, m in enumerate(json_rows):
        row = 2 + i  # excel row 3+
        name = m.group(1)
        class_id = m.group(2)
        group_cell = rm_cells.get((row, 0)) or rp_cells.get((row, 0))
        mark_short = rm_cells.get((row, 1))

        rm = row_series(rm_cells, row, col_start, n_temps)
        rp = row_series(rp_cells, row, col_start, n_temps)
        a = row_series(a_cells, row, col_start, n_temps)
        z = row_series(z_cells, row, col_start, n_temps)
        alpha = row_series(alpha_cells, row, col_start, n_temps)
        e = row_series(e_cells, row, col_start, n_temps)

        def to_map(arr: list) -> dict[str, float | None]:
            d = {}
            for t, val in zip(TEMPS, arr):
                if val is not None:
                    d[str(t)] = val
            return d

        grades.append(
            {
                "name": name,
                "classId": class_id,
                "group": str(group_cell) if group_cell else None,
                "mark": normalize_mark(mark_short),
                "rm": to_map(rm),
                "rp02": to_map(rp),
                "elongationA": to_map(a),
                "reductionZ": to_map(z),
                "thermalExpansionAlpha": to_map(alpha),
                "elasticModulusE": to_map(e),
            }
        )

    out = {
        "source": "ПНАЭ физмех свойства.xlsx",
        "standard": "ПНАЭ Г-7-002-86",
        "temperaturesC": TEMPS,
        "properties": {
            "rm": { "label": "Rm", "unit": "МПа" },
            "rp02": { "label": "Rp0,2", "unit": "МПа" },
            "elongationA": { "label": "A", "unit": "%" },
            "reductionZ": { "label": "Z", "unit": "%" },
            "thermalExpansionAlpha": { "label": "α", "unit": "10⁻⁶·°C⁻¹" },
            "elasticModulusE": { "label": "E", "unit": "ГПа" },
        },
        "grades": grades,
    }

    root = Path(__file__).resolve().parent.parent
    for out_path in (
        root / "apps/web/public/data/pnae-steel-properties.json",
        root / "data/pnae-steel-properties.json",
    ):
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(grades)} grades with extended properties")


if __name__ == "__main__":
    main()
