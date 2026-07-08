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


def build_full_handbook(pnae_path: Path) -> dict:
    """Полный каталог: все марки/сортаменты из ПНАЭ JSON + титан из ГОСТ."""
    pnae = json.loads(pnae_path.read_text(encoding="utf-8"))
    titanium = build_titanium_minimal()

    grades: list[dict] = []
    for g in pnae["grades"]:
        if g.get("group") == "Титан":
            continue
        entry = {k: v for k, v in g.items() if k != "gost34233_1"}
        grades.append(entry)

    grades.extend(titanium["grades"])

    temps = sorted(set(pnae["temperaturesC"]) | set(titanium["temperaturesC"]))

    return {
        "source": (
            "ГОСТ 34233.1—2017: марки, сортамент и механические свойства по приложению Б; "
            "табличные [σ] — приложение А (титан), для остальных марок — расчёт по Rm/Rp0,2"
        ),
        "standard": "ГОСТ 34233.1—2017",
        "temperaturesC": temps,
        "properties": pnae["properties"],
        "grades": grades,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--pdf",
        type=str,
        default=r"C:\Users\dima\Desktop\4293739672.pdf",
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
    args = ap.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if args.full:
        data = build_full_handbook(Path(args.pnae))
    else:
        data = None
        if args.safe:
            data = extract_titanium_tables_word_safe(args.pdf)
        if not data:
            data = build_titanium_minimal()
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()

