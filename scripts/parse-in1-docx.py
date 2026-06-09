# -*- coding: utf-8 -*-
import re
import sys
import zipfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
p = Path(
    r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 1 допускаемые напряжения.docx"
)
with zipfile.ZipFile(p) as z:
    xml = z.read("word/document.xml").decode("utf-8")
    rels = z.read("word/_rels/document.xml.rels").decode("utf-8")

id_to_target = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
embeds = re.findall(r'r:embed="([^"]+)"', xml)
texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml)

chunks = re.split(r"<w:br\s*/>", xml)
print("embed count", len(embeds))
for i, eid in enumerate(embeds):
    print(i + 1, id_to_target.get(eid, eid))
