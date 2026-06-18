"""Extract docx paragraphs + simplified omath as linear text."""
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
}

def omath_linear(el) -> str:
    parts: list[str] = []
    for child in el.iter():
        tag = child.tag.split("}")[-1]
        if tag == "t" and child.text:
            parts.append(child.text)
        elif tag in ("f", "frac"):
            pass
        elif tag == "rad":
            parts.append("sqrt(")
        elif tag == "e":
            pass
        elif tag == "sup":
            parts.append("^")
        elif tag == "sub":
            parts.append("_")
    return "".join(parts)

def para_text(p) -> str:
    chunks: list[str] = []
    for node in p.iter():
        tag = node.tag.split("}")[-1]
        if tag == "t" and node.text:
            chunks.append(node.text)
        elif tag == "oMath":
            chunks.append(omath_linear(node))
    return "".join(chunks).strip()

paths = [
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 8 колено.docx"),
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 9 круглые плоские днища крышки.docx"),
]
out: list[str] = []
for p in paths:
    out.append("=" * 80)
    out.append(p.name)
    with zipfile.ZipFile(p) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    for para in root.findall(".//w:p", NS):
        t = para_text(para)
        if t:
            out.append(t)
Path(__file__).resolve().parent.joinpath("_in-89-full.txt").write_text("\n".join(out), encoding="utf-8")
print("lines", len(out))
