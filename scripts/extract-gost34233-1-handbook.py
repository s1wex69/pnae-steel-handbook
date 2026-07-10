# -*- coding: utf-8 -*-
"""
Генерация JSON-данных справочника ГОСТ 34233.1.

Word COM часто является самым простым способом достать табличные данные
из PDF, но полный `doc.Content.Text` может зависать/падать.

Поэтому скрипт поддерживает два сценария:
1) default/fallback: всегда генерирует минимальный набор (титан), чтобы
   UI мог отрисовать σ/σ13/σRV и чтобы мы могли валидацию продолжать.
2) --safe: попытка извлечь ограниченный набор по нужным таблицам титана
   (Приложение А: табл. А.7, Приложение Б: табл. Б.14/Б.15) через Word COM,
   но без чтения всего текста документа (только параграфы и ограниченные окна
   после заголовков).

Формат JSON совместим с `apps/web/src/types/steel.ts` (модель `SteelHandbook`).
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def build_titanium_minimal() -> dict:
    # Данные взяты из таблиц ГОСТ 34233.1—2017 для титановых сплавов:
    # - Приложение А: таблица А.7 (допускаемое напряжение [a])
    # - Приложение Б: таблицы Б.14 (Rp0,2) и Б.15 (Rm)
    # - Приложение В: В.1 (модуль продольной упругости для Титана, (10^-5 E))
    # - Приложение Г: П1 (коэффициенты линейного расширения для титановых сплавов)
    # Важно: для α значения заданы на опорных температурных точках и затем
    # UI интерполирует/экстраполирует.

    return {
        "source": "ГОСТ 34233.1—2017 (минимальный набор: титан для UI-валидации)",
        "standard": "ГОСТ 34233.1—2017",
        "temperaturesC": [20, 100, 150, 200, 250, 300, 350, 400],
        "properties": {
            "rm": {"label": "Rm", "unit": "МПа"},
            "rp02": {"label": "Rp0,2", "unit": "МПа"},
            "elongationA": {"label": "A", "unit": "%"},
            "reductionZ": {"label": "Z", "unit": "%"},
            "thermalExpansionAlpha": {"label": "α", "unit": "мкК⁻¹"},
            "elasticModulusE": {"label": "E", "unit": "ГПа"},
        },
        "grades": [
            {
                "name": "ВТ1-0 (листовой прокат)",
                "classId": "TITANIUM",
                "group": "Титан",
                "mark": "ВТ1-0",
                "rm": {"20": 373, "100": 329, "200": 275, "250": 245, "300": 221},
                "rp02": {"20": 304, "100": 255, "200": 206, "250": 189, "300": 172},
                "thermalExpansionAlpha": {"20": 8.8, "100": 8.8, "200": 8.9, "300": 9.3},
                # В.1: E(ГПа) = (10^-5 E) * 100
                "elasticModulusE": {
                    "20": 115,
                    "100": 110,
                    "150": 106,
                    "200": 101,
                    "250": 95,
                    "300": 88,
                },
                "gost34233_1": {
                    "allowableSigma": {"20": 143, "100": 126, "200": 106, "250": 94, "300": 85}
                },
            },
            {
                "name": "ОТ4-0 (листовой прокат)",
                "classId": "TITANIUM",
                "group": "Титан",
                "mark": "ОТ4-0",
                "rm": {
                    "20": 471,
                    "100": 407,
                    "200": 327,
                    "250": 294,
                    "300": 250,
                    "350": 245,
                    "400": 240,
                },
                "rp02": {
                    "20": 392,
                    "100": 324,
                    "200": 235,
                    "250": 196,
                    "300": 177,
                    "350": 157,
                    "400": 147,
                },
                "thermalExpansionAlpha": {"20": 8.8, "100": 8.8, "200": 8.9, "300": 9.3},
                "elasticModulusE": {
                    "20": 115,
                    "100": 110,
                    "150": 106,
                    "200": 101,
                    "250": 95,
                    "300": 88,
                },
                "gost34233_1": {
                    "allowableSigma": {
                        "20": 181,
                        "100": 156,
                        "200": 129,
                        "250": 118,
                        "300": 96,
                        "350": 94,
                        "400": 92,
                    }
                },
            },
            {
                "name": "АТЗ (листовой прокат)",
                "classId": "TITANIUM",
                "group": "Титан",
                "mark": "АТЗ",
                "rm": {"20": 589, "100": 518, "200": 439, "250": 422, "300": 407, "350": 372},
                "rp02": {"20": 530, "100": 466, "200": 394, "250": 380, "300": 367, "350": 334},
                "thermalExpansionAlpha": {"20": 8.8, "100": 8.8, "200": 8.9, "300": 9.3},
                "elasticModulusE": {
                    "20": 115,
                    "100": 110,
                    "150": 106,
                    "200": 101,
                    "250": 95,
                    "300": 88,
                },
                "gost34233_1": {
                    "allowableSigma": {"20": 226, "100": 199, "200": 169, "250": 162, "300": 156, "350": 143}
                },
            },
            {
                "name": "ВТ1-00 (листовой прокат)",
                "classId": "TITANIUM",
                "group": "Титан",
                "mark": "ВТ1-00",
                "rm": {"20": 294, "100": 250, "200": 196, "250": 167, "300": 142},
                "rp02": {"20": 245, "100": 196, "200": 147, "250": 123, "300": 113},
                "thermalExpansionAlpha": {"20": 8.8, "100": 8.8, "200": 8.9, "300": 9.3},
                "elasticModulusE": {
                    "20": 115,
                    "100": 110,
                    "150": 106,
                    "200": 101,
                    "250": 95,
                    "300": 88,
                },
                "gost34233_1": {
                    "allowableSigma": {"20": 113, "100": 96, "200": 75, "250": 64, "300": 55}
                },
            },
        ],
    }


def _norm(s: str) -> str:
    # Убираем пробелы/переносы, чтобы сопоставлять OCR типа "Т а б л и ц а" с "таблица"
    return re.sub(r"\s+", "", s).lower()


def extract_titanium_tables_word_safe(pdf_path: str, max_paragraphs: int = 25000) -> dict | None:
    """
    Safe-mode extraction:
    - открываем PDF в Word
    - идём по параграфам
    - находим заголовки таблиц и читаем ограниченное окно после них
    """
    try:
        import win32com.client  # type: ignore
    except Exception:
        return None

    w = win32com.client.Dispatch("Word.Application")
    w.Visible = False
    w.DisplayAlerts = 0

    doc = None
    try:
        doc = w.Documents.Open(pdf_path, False, True, False)
        paras = doc.Paragraphs
        total = min(int(paras.Count), int(max_paragraphs))

        CAPTURE_WINDOW = 120
        capture_mode: str | None = None
        capture_left = 0

        captures: dict[str, list[str]] = {"a7": [], "b14": [], "b15": []}
        found = {"a7": False, "b14": False, "b15": False}

        for i in range(1, total + 1):
            try:
                txt = paras.Item(i).Range.Text
            except Exception:
                continue

            if not txt:
                continue

            txt = txt.replace("\x07", "").replace("\r", " ").strip()
            if not txt:
                continue

            if capture_mode is not None:
                captures[capture_mode].append(txt)
                capture_left -= 1
                if capture_left <= 0:
                    capture_mode = None
                continue

            n = _norm(txt)
            if "таблицаа.7" in n:
                capture_mode = "a7"
                capture_left = CAPTURE_WINDOW
                found["a7"] = True
                continue
            if "таблицаб.14" in n:
                capture_mode = "b14"
                capture_left = CAPTURE_WINDOW
                found["b14"] = True
                continue
            if "таблицаб.15" in n:
                capture_mode = "b15"
                capture_left = CAPTURE_WINDOW
                found["b15"] = True
                continue

            if all(found.values()):
                # захватили нужное, можно выйти раньше
                if all(len(captures[k]) > 0 for k in captures):
                    break

        if not (captures["a7"] and captures["b14"] and captures["b15"]):
            return None

        def parse_rows_to_cols(lines: list[str], expected_cols: int) -> dict[int, list[float | None]]:
            out: dict[int, list[float | None]] = {}
            for raw_line in lines:
                line = raw_line.strip()
                if not line:
                    continue
                # Ищем токены: температура и значения (OCR может содержать "—")
                tokens: list[float | None] = []
                for m in re.finditer(r"(—|–|-|\\d[\\d\\s]*[.,]?\\d*)", line):
                    tok = m.group(1)
                    if tok in ("—", "–", "-"):
                        tokens.append(None)
                        continue
                    tok_n = tok.replace(" ", "").replace(",", ".")
                    try:
                        tokens.append(float(tok_n))
                    except Exception:
                        tokens.append(None)

                if len(tokens) < expected_cols + 1:
                    continue

                temp = tokens[0]
                if temp is None:
                    continue
                temp_i = int(round(temp))
                vals = tokens[1 : 1 + expected_cols]
                out[temp_i] = vals
            return out

        # Ожидаемый порядок колонок в табл. А.7/Б.14/Б.15 для титановых сплавов:
        # ВТ1-0, ОТ4-0, АТЗ, ВТ1-00
        cols_a7 = parse_rows_to_cols(captures["a7"], expected_cols=4)
        cols_b14 = parse_rows_to_cols(captures["b14"], expected_cols=4)
        cols_b15 = parse_rows_to_cols(captures["b15"], expected_cols=4)

        if not cols_a7 or not cols_b14 or not cols_b15:
            return None

        base = build_titanium_minimal()
        mark_order = ["ВТ1-0", "ОТ4-0", "АТЗ", "ВТ1-00"]

        by_mark = {g["mark"]: g for g in base["grades"]}

        for mark_i, mark in enumerate(mark_order):
            grade = by_mark.get(mark)
            if not grade:
                continue

            grade["gost34233_1"]["allowableSigma"] = {
                str(t): v[mark_i]
                for t, v in cols_a7.items()
                if v[mark_i] is not None
            }
            grade["rp02"] = {str(t): v[mark_i] for t, v in cols_b14.items() if v[mark_i] is not None}
            grade["rm"] = {str(t): v[mark_i] for t, v in cols_b15.items() if v[mark_i] is not None}

        # temperaturesC — объединение температур по rm/rp02
        temps_set = set()
        for g in base["grades"]:
            temps_set.update(int(k) for k in g["rm"].keys())
            temps_set.update(int(k) for k in g["rp02"].keys())
        base["temperaturesC"] = sorted(list(temps_set))
        return base

    finally:
        try:
            if doc is not None:
                doc.Close(False)
        except Exception:
            pass
        try:
            w.Quit()
        except Exception:
            pass


def _parse_thickness_band(name: str) -> tuple[float | None, float | None]:
    """Извлекает диапазон толщины из названия сортамента (мм)."""
    n = name.lower().replace(",", ".")
    m = re.search(r"толщиной\s+до\s+(\d+(?:\.\d+)?)\s*мм", n)
    if m:
        return (None, float(m.group(1)))
    m = re.search(r"толщиной\s+от\s+(\d+(?:\.\d+)?)\s+до\s+(\d+(?:\.\d+)?)\s*мм", n)
    if m:
        return (float(m.group(1)), float(m.group(2)))
    m = re.search(r"толщиной\s+свыше\s+(\d+(?:\.\d+)?)\s*мм", n)
    if m:
        return (float(m.group(1)), None)
    return (None, None)


def _pick_appendix_column(
    columns: list[dict],
    mark: str,
    grade_name: str,
) -> str | None:
    """Выбирает колонку приложения А по марке и толщине сортамента."""
    lo, hi = _parse_thickness_band(grade_name)
    mid = None
    if lo is not None and hi is not None:
        mid = (lo + hi) / 2
    elif hi is not None:
        mid = hi / 2
    elif lo is not None:
        mid = lo + 1

    matching = [c for c in columns if mark in c.get("marks", [])]
    if not matching:
        for c in columns:
            for m in c.get("marks", []):
                if mark.startswith(m) or m.startswith(mark):
                    matching.append(c)
        matching = list({id(c): c for c in matching}.values())
    if not matching:
        return None
    if len(matching) == 1:
        return matching[0]["id"]

    def score(col: dict) -> float:
        th = col.get("thicknessMm") or {}
        tmin = th.get("min")
        tmax = th.get("max")
        if mid is None:
            return 0 if tmax is not None and tmax <= 32 else 1
        if tmin is not None and tmax is not None:
            if tmin <= mid <= tmax:
                return 0
            return abs(mid - (tmin + tmax) / 2)
        if tmax is not None:
            return 0 if mid <= tmax else mid - tmax
        if tmin is not None:
            return 0 if mid > tmin else tmin - mid
        return 1

    return min(matching, key=score)["id"]


def load_appendix_a(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build_appendix_a_lookup(appendix: dict) -> dict[str, dict[str, dict[str, float]]]:
    """
    mark -> column_id -> {temp: sigma}
  Для каждой марки может быть несколько колонок (разная толщина).
    """
    lookup: dict[str, dict[str, dict[str, float]]] = {}
    for table in appendix.get("tables", {}).values():
        columns = table.get("columns", [])
        sigma_by_col = table.get("sigma", {})
        for col in columns:
            col_id = col["id"]
            sigma_map = sigma_by_col.get(col_id)
            if not sigma_map:
                continue
            for mark in col.get("marks", []):
                lookup.setdefault(mark, {})[col_id] = {
                    str(int(k) if float(k).is_integer() else k): float(v)
                    for k, v in sigma_map.items()
                }
    return lookup


def merge_appendix_a_into_grades(
    grades: list[dict],
    appendix_path: Path,
) -> tuple[int, set[str]]:
    appendix = load_appendix_a(appendix_path)
    lookup = build_appendix_a_lookup(appendix)
    tabulated_marks: set[str] = set()
    merged = 0

    for grade in grades:
        mark = grade.get("mark")
        if not mark:
            continue
        mark_tables = lookup.get(mark)
        if not mark_tables:
            for key in lookup:
                if mark == key or mark.startswith(key) or key.startswith(mark):
                    mark_tables = lookup[key]
                    break
        if not mark_tables:
            continue

        all_columns = []
        for table in appendix.get("tables", {}).values():
            all_columns.extend(table.get("columns", []))

        col_id = _pick_appendix_column(all_columns, mark, grade.get("name", ""))
        if not col_id or col_id not in mark_tables:
            col_id = next(iter(mark_tables))
        sigma_map = mark_tables.get(col_id)
        if not sigma_map:
            continue

        grade["gost34233_1"] = {"allowableSigma": dict(sigma_map)}
        tabulated_marks.add(mark)
        merged += 1

    return merged, tabulated_marks


# Марки, отсутствующие в ПНАЭ — добавляются из ГОСТ (прил. А.4–А.6)
GOST_ONLY_MARK_META: dict[str, tuple[str, str, str]] = {
    # mark -> (group, classId, sortament label)
    "08Х18Г8Н2Т": ("Сталь хромоникелевая коррозионно-стойкого аустенитного класса", "СВН", "Лист (ГОСТ 34233.1)"),
    "07Х13АГ20": ("Сталь высокохромистая", "СВХ", "Лист (ГОСТ 34233.1)"),
    "02Х8Н22С6": ("Сплав на железоникелевой основе", "СЖНО", "Лист (ГОСТ 34233.1)"),
    "15Х18Н12С4ТЮ": ("Сталь хромоникелевая коррозионно-стойкого аустенитного класса", "СВН", "Лист (ГОСТ 34233.1)"),
    "06ХН28МДТ": ("Сплав на железоникелевой основе", "СЖНО", "Лист (ГОСТ 34233.1)"),
    "03ХН28МДТ": ("Сплав на железоникелевой основе", "СЖНО", "Лист (ГОСТ 34233.1)"),
    "08Х22Н6Т": ("Сталь хромоникелевая коррозионно-стойкого аустенитного класса", "СВН", "Лист (ГОСТ 34233.1)"),
    "08Х21Н6М2Т": ("Сталь хромоникелевая коррозионно-стойкого аустенитного класса", "СВН", "Лист (ГОСТ 34233.1)"),
    "А85М": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "А8М": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АДМ": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АДОМ": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АД1М": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АМцМ": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АМцСМ": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АМг2М": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АМгЗМ": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АМг5М": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "АМгбМ": ("Алюминий и его сплавы", "ALUMINUM", "Лист отожжённый (ГОСТ 34233.1)"),
    "М2": ("Медь и её сплавы", "COPPER", "Лист 3–10 мм (ГОСТ 34233.1)"),
    "М3": ("Медь и её сплавы", "COPPER", "Лист 3–10 мм (ГОСТ 34233.1)"),
    "МЗр": ("Медь и её сплавы", "COPPER", "Лист 3–10 мм (ГОСТ 34233.1)"),
    "Л63": ("Медь и её сплавы", "COPPER", "Лист 3–10 мм (ГОСТ 34233.1)"),
    "ЛС59-1": ("Медь и её сплавы", "COPPER", "Лист 3–10 мм (ГОСТ 34233.1)"),
    "Л062-1": ("Медь и её сплавы", "COPPER", "Лист 3–10 мм (ГОСТ 34233.1)"),
    "ЛЖМц59-1-1": ("Медь и её сплавы", "COPPER", "Лист 3–10 мм (ГОСТ 34233.1)"),
}


def load_appendix_b(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_appendix_vg(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build_appendix_b_lookup(appendix: dict) -> dict[str, dict[str, dict[str, dict[str, float]]]]:
    """
    mark -> column_id -> { rp02: {temp: val}, rm: {temp: val} }
    """
    lookup: dict[str, dict[str, dict[str, dict[str, float]]]] = {}
    for table in appendix.get("tables", {}).values():
        prop = table.get("property")
        if prop not in ("rp02", "rm"):
            continue
        columns = table.get("columns", [])
        values_by_col = table.get("values", {})
        for col in columns:
            col_id = col["id"]
            vals = values_by_col.get(col_id)
            if not vals:
                continue
            temp_map = {
                str(int(k) if float(k).is_integer() else k): float(v)
                for k, v in vals.items()
            }
            for mark in col.get("marks", []):
                lookup.setdefault(mark, {}).setdefault(col_id, {})[prop] = temp_map
    return lookup


def _resolve_mark_tables(
    lookup: dict[str, dict[str, dict[str, dict[str, float]]]],
    mark: str,
) -> dict[str, dict[str, dict[str, float]]] | None:
    if mark in lookup:
        return lookup[mark]
    for key in lookup:
        if mark == key or mark.startswith(key) or key.startswith(mark):
            return lookup[key]
    return None


def merge_appendix_b_into_grades(
    grades: list[dict],
    appendix_b_path: Path,
    appendix_a_path: Path,
) -> tuple[int, set[str]]:
    appendix_b = load_appendix_b(appendix_b_path)
    lookup = build_appendix_b_lookup(appendix_b)
    all_columns: list[dict] = []
    for table in appendix_b.get("tables", {}).values():
        all_columns.extend(table.get("columns", []))

    merged_marks: set[str] = set()
    merged = 0

    for grade in grades:
        mark = grade.get("mark")
        if not mark:
            continue
        mark_tables = _resolve_mark_tables(lookup, mark)
        if not mark_tables:
            continue

        col_id = _pick_appendix_column(all_columns, mark, grade.get("name", ""))
        if not col_id or col_id not in mark_tables:
            col_id = next(iter(mark_tables))
        props = mark_tables[col_id]
        applied = False
        if props.get("rp02"):
            grade["rp02"] = dict(props["rp02"])
            applied = True
        if props.get("rm"):
            grade["rm"] = dict(props["rm"])
            applied = True
        if applied:
            merged_marks.add(mark)
            merged += 1

    return merged, merged_marks


def _e1e5_to_gpa(e_map: dict[str, float]) -> dict[str, float]:
    return {
        str(int(k) if float(k).is_integer() else k): round(float(v) * 100, 1)
        for k, v in e_map.items()
    }


def build_e_lookup(appendix_vg: dict) -> dict[str, dict[str, float]]:
    out: dict[str, dict[str, float]] = {}
    em = appendix_vg.get("elasticModulus", {})
    for cls in em.get("materialClasses", {}).values():
        gpa = _e1e5_to_gpa(cls.get("e1e5", {}))
        for mark in cls.get("marks", []):
            out[mark] = gpa
    return out


def build_alpha_lookup(appendix_vg: dict) -> dict[str, dict[str, float]]:
    te = appendix_vg.get("thermalExpansion", {})
    by_mark = te.get("byMark", {})
    return {
        mark: {str(int(k) if float(k).is_integer() else k): float(v) for k, v in vals.items()}
        for mark, vals in by_mark.items()
    }


def apply_modulus_and_alpha(
    grades: list[dict],
    appendix_vg_path: Path,
) -> None:
    vg = load_appendix_vg(appendix_vg_path)
    e_lookup = build_e_lookup(vg)
    alpha_lookup = build_alpha_lookup(vg)

    for grade in grades:
        mark = grade.get("mark")
        if not mark:
            continue
        for key, e_map in e_lookup.items():
            if mark == key or mark.startswith(key) or key.startswith(mark):
                grade["elasticModulusE"] = dict(e_map)
                break
        alpha = alpha_lookup.get(mark)
        if not alpha:
            for key, a_map in alpha_lookup.items():
                if mark == key or mark.startswith(key) or key.startswith(mark):
                    alpha = a_map
                    break
        if alpha:
            alpha_out = {"20": alpha.get("100", next(iter(alpha.values())))}
            alpha_out.update(alpha)
            grade["thermalExpansionAlpha"] = alpha_out


def add_gost_only_grades(
    grades: list[dict],
    appendix_a_path: Path,
    appendix_b_path: Path,
) -> list[str]:
    """Добавляет записи для марок из ГОСТ, отсутствующих в ПНАЭ."""
    existing_marks = {g.get("mark") for g in grades if g.get("mark")}
    added: list[str] = []

    appendix_a = load_appendix_a(appendix_a_path)
    appendix_b = load_appendix_b(appendix_b_path)
    b_lookup = build_appendix_b_lookup(appendix_b)
    a_lookup = build_appendix_a_lookup(appendix_a)
    all_a_cols: list[dict] = []
    for table in appendix_a.get("tables", {}).values():
        all_a_cols.extend(table.get("columns", []))
    all_b_cols: list[dict] = []
    for table in appendix_b.get("tables", {}).values():
        all_b_cols.extend(table.get("columns", []))

    for mark, (group, class_id, sortament) in GOST_ONLY_MARK_META.items():
        if mark in existing_marks:
            continue

        grade_name = f"{mark} ({sortament})"
        entry: dict = {
            "name": grade_name,
            "classId": class_id,
            "group": group,
            "mark": mark,
            "rm": {},
            "rp02": {},
        }

        mark_b = _resolve_mark_tables(b_lookup, mark)
        if mark_b:
            col_id = _pick_appendix_column(all_b_cols, mark, grade_name) or next(iter(mark_b))
            props = mark_b.get(col_id, {})
            if props.get("rp02"):
                entry["rp02"] = dict(props["rp02"])
            if props.get("rm"):
                entry["rm"] = dict(props["rm"])

        mark_a = a_lookup.get(mark)
        if not mark_a:
            for key in a_lookup:
                if mark == key or mark.startswith(key) or key.startswith(mark):
                    mark_a = a_lookup[key]
                    break
        if mark_a:
            col_id = _pick_appendix_column(all_a_cols, mark, grade_name) or next(iter(mark_a))
            sigma = mark_a.get(col_id)
            if sigma:
                entry["gost34233_1"] = {"allowableSigma": dict(sigma)}

        grades.append(entry)
        existing_marks.add(mark)
        added.append(mark)

    return added


def collect_temperatures(*sources: dict | list) -> list[int]:
    temps: set[int] = set()
    for src in sources:
        if isinstance(src, list):
            for item in src:
                if isinstance(item, (int, float)):
                    temps.add(int(item))
            continue
        if isinstance(src, dict):
            if "temperaturesC" in src:
                temps.update(int(t) for t in src["temperaturesC"])
            for table in src.get("tables", {}).values():
                for data_map in list(table.get("sigma", {}).values()) + list(table.get("values", {}).values()):
                    for t in data_map:
                        temps.add(int(float(t)))
            for grade in src.get("grades", []):
                for prop in ("rm", "rp02", "thermalExpansionAlpha", "elasticModulusE"):
                    pmap = grade.get(prop)
                    if pmap:
                        temps.update(int(float(k)) for k in pmap)
                gost = grade.get("gost34233_1", {}).get("allowableSigma")
                if gost:
                    temps.update(int(float(k)) for k in gost)
    return sorted(temps)


def build_full_handbook(
    pnae_path: Path,
    appendix_a_path: Path | None = None,
    appendix_b_path: Path | None = None,
    appendix_vg_path: Path | None = None,
) -> dict:
    """Полный каталог: ПНАЭ + титан + прил. А/Б/В/Г."""
    pnae = json.loads(pnae_path.read_text(encoding="utf-8"))
    titanium = build_titanium_minimal()

    grades: list[dict] = []
    for g in pnae["grades"]:
        if g.get("group") == "Титан":
            continue
        entry = {k: v for k, v in g.items() if k != "gost34233_1"}
        grades.append(entry)

    grades.extend(titanium["grades"])

    appendix_a_path = appendix_a_path or Path("scripts/data/gost34233-1-appendix-a.json")
    appendix_b_path = appendix_b_path or Path("scripts/data/gost34233-1-appendix-b.json")
    appendix_vg_path = appendix_vg_path or Path("scripts/data/gost34233-1-appendix-vg.json")

    a_merged, tabulated_marks = merge_appendix_a_into_grades(grades, appendix_a_path)
    b_merged, b_marks = merge_appendix_b_into_grades(grades, appendix_b_path, appendix_a_path)
    apply_modulus_and_alpha(grades, appendix_vg_path)
    new_marks = add_gost_only_grades(grades, appendix_a_path, appendix_b_path)
    apply_modulus_and_alpha(grades, appendix_vg_path)

    # Повторно применить σ для новых марок
    merge_appendix_a_into_grades(grades, appendix_a_path)

    appendix_a = load_appendix_a(appendix_a_path)
    appendix_b = load_appendix_b(appendix_b_path)
    appendix_vg = load_appendix_vg(appendix_vg_path)
    temps = collect_temperatures(pnae, titanium, appendix_a, appendix_b, {"grades": grades})

    marks_list = ", ".join(sorted(tabulated_marks)[:15])
    if len(tabulated_marks) > 15:
        marks_list += f" и ещё {len(tabulated_marks) - 15}"

    return {
        "source": (
            "ГОСТ 34233.1—2017: механические свойства по приложению Б "
            f"({b_merged} сортаментов, {len(b_marks)} марок); "
            f"табличные [σ] — приложение А ({a_merged} сортаментов); "
            f"E — прил. В, α — прил. Г; "
            f"добавлено {len(new_marks)} марок (Al/Cu/fe-ni)"
        ),
        "standard": "ГОСТ 34233.1—2017",
        "temperaturesC": temps,
        "properties": pnae["properties"],
        "grades": grades,
        "_stats": {
            "grades": len(grades),
            "tabulated_marks": len(tabulated_marks),
            "b_marks": len(b_marks),
            "new_marks": new_marks,
        },
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--pdf",
        type=str,
        default=r"C:\Users\user\Desktop\4293739672.pdf",
        help="Путь к PDF ГОСТ 34233.1",
    )
    ap.add_argument(
        "--out",
        type=str,
        default=str(Path("apps/web/public/data/gost34233-1-steel-properties.json")),
        help="Куда записать JSON",
    )
    ap.add_argument(
        "--safe",
        action="store_true",
        help="Пытаться извлечь таблицы титана через Word COM в ограниченном режиме",
    )
    ap.add_argument(
        "--full",
        action="store_true",
        help="Собрать полный каталог: все марки/сортаменты из ПНАЭ JSON + титан",
    )
    ap.add_argument(
        "--pnae",
        type=str,
        default=str(Path("apps/web/public/data/pnae-steel-properties.json")),
        help="Источник марок/сортаментов для --full",
    )
    ap.add_argument(
        "--appendix-a",
        type=str,
        default=str(Path("scripts/data/gost34233-1-appendix-a.json")),
        help="Структурированные таблицы приложения А",
    )
    ap.add_argument(
        "--appendix-b",
        type=str,
        default=str(Path("scripts/data/gost34233-1-appendix-b.json")),
        help="Структурированные таблицы приложения Б",
    )
    ap.add_argument(
        "--appendix-vg",
        type=str,
        default=str(Path("scripts/data/gost34233-1-appendix-vg.json")),
        help="Модуль E (прил. В) и α (прил. Г)",
    )
    args = ap.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if args.full:
        data = build_full_handbook(
            Path(args.pnae),
            Path(args.appendix_a),
            Path(args.appendix_b),
            Path(args.appendix_vg),
        )
        stats = data.pop("_stats", {})
    else:
        data = None
        stats = {}
        if args.safe:
            data = extract_titanium_tables_word_safe(args.pdf)
        if not data:
            data = build_titanium_minimal()
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path}")
    if stats:
        print(
            f"Stats: grades={stats.get('grades')}, "
            f"tabulated_marks={stats.get('tabulated_marks')}, "
            f"b_marks={stats.get('b_marks')}, "
            f"new_marks={len(stats.get('new_marks', []))}"
        )


if __name__ == "__main__":
    main()

