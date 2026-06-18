import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

paths = [
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 6 полусферическое днище.docx"),
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 7 цилиндр коллектор штуцер труба.docx"),
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 8 колено.docx"),
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 9 круглые плоские днища крышки.docx"),
]

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
out = Path(__file__).resolve().parent / "_in-methodologies.txt"

lines: list[str] = []
for p in paths:
    lines.append("=" * 80)
    lines.append(p.name)
    lines.append("=" * 80)
    with zipfile.ZipFile(p) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    for para in root.findall(".//w:p", NS):
        texts = [t.text for t in para.findall(".//w:t", NS) if t.text]
        if texts:
            lines.append("".join(texts))
    lines.append("")

out.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {out} ({len(lines)} lines)")
