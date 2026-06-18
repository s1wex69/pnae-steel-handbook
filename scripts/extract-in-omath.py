import zipfile
import xml.etree.ElementTree as ET
import re
from pathlib import Path

M = "http://schemas.openxmlformats.org/officeDocument/2006/math"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

paths = [
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 6 полусферическое днище.docx"),
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 7 цилиндр коллектор штуцер труба.docx"),
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 8 колено.docx"),
    Path(r"d:\Яндекс\Yandex.Disk\ИНТЕХ-АТОМ\НИОКР\1 Внутренние НИОКРы\Инженерные расчеты для ПО\ИНСТРУКЦИИ\ИН № 9 круглые плоские днища крышки.docx"),
]

def text_of(el):
    parts = []
    for t in el.iter():
        tag = t.tag.split('}')[-1]
        if tag == 't' and t.text:
            parts.append(t.text)
        if tag == 'tab':
            parts.append(' ')
    return ''.join(parts).strip()

out = []
for p in paths:
    out.append('='*80)
    out.append(p.name)
    out.append('='*80)
    with zipfile.ZipFile(p) as z:
        xml = z.read('word/document.xml')
    root = ET.fromstring(xml)
    for om in root.iter(f'{{{M}}}oMath'):
        t = text_of(om)
        if t:
            out.append(t)
    out.append('')

Path(__file__).resolve().parent.joinpath('_in-formulas.txt').write_text('\n'.join(out), encoding='utf-8')
print('done', len(out))
