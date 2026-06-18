# GitHub Pages + Tilda: публичный репо, закрытый ПНАЭ

Репозиторий **Public** — для бесплатного GitHub Pages.  
Справочник **не открывается** при прямой ссылке: только во iframe на **intech-atom.ru**.

## Адреса после публикации

| Виджет | URL |
|--------|-----|
| Справочник | https://intechatom.github.io/pnae-steel-handbook/pnae/ |
| Калькулятор (внутр.) | https://intechatom.github.io/pnae-steel-handbook/calc1/ |
| Калькулятор (наруж.) | https://intechatom.github.io/pnae-steel-handbook/calc2/ |

## 1. Загрузить на GitHub

```powershell
cd C:\Users\user\Desktop\stresscalc
git push -u origin main
```

Репозиторий: **Public**, имя например `pnae-steel-handbook`.

## 2. Включить Pages

**Settings → Pages → Source: GitHub Actions**

После push — workflow **Deploy handbook to GitHub Pages** (1–3 мин).

## 3. Вставка в Tilda

Блок **T123**, файл `tilda-hosted/01-spravochnik/TILDA-ВСТАВКА.html` или `docs/tilda-embed.html`:

```html
<div style="width:100%;max-width:1200px;margin:0 auto;">
  <iframe
    src="https://intechatom.github.io/pnae-steel-handbook/pnae/"
    title="Справочник ПНАЭ"
    style="width:100%;height:min(92vh,1400px);min-height:900px;border:0;border-radius:12px;"
    loading="lazy"
  ></iframe>
</div>
```

**Опубликуйте** страницу Tilda.

## 4. Обновление

```powershell
git add .
git commit -m "Обновление справочника"
git push
```

## Защита доступа

- Прямой заход на GitHub Pages → заглушка «только на сайте ИНТЕХ-АТОМ»
- Iframe с чужого домена → отказ
- Iframe с intech-atom.ru → справочник работает

Полная инструкция: `deploy/github/ИНСТРУКЦИЯ.md`
