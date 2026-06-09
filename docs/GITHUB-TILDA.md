# Публикация на GitHub Pages и вставка в Tilda

## Адрес справочника после публикации

https://s1wex69.github.io/pnae-steel-handbook/

## 1. Отправить код на GitHub (один раз)

На ПК уже выполнены: `git init`, коммит, remote `origin`.

### Вариант A — GitHub Desktop (проще всего)

1. Установите [GitHub Desktop](https://desktop.github.com/)
2. **File → Add local repository** → папка `C:\Users\user\Desktop\stresscalc`
3. Войдите в аккаунт `s1wex69`
4. Нажмите **Publish repository** или **Push origin**
5. Если спросит про конфликт с README на GitHub — выберите **force push** / перезапись (на GitHub только пустой README)

### Вариант B — командная строка

```powershell
cd C:\Users\user\Desktop\stresscalc
git push -u origin main --force
```

При запросе логина: Personal Access Token с правом `repo` вместо пароля.  
Создать: GitHub → Settings → Developer settings → Personal access tokens.

## 2. Включить GitHub Pages

1. Репозиторий **pnae-steel-handbook** → **Settings** → **Pages**
2. **Source**: **GitHub Actions**
3. После push откроется workflow **Deploy handbook to GitHub Pages**
4. Дождитесь зелёной галочки в **Actions** (1–3 мин)

## 3. Проверка

Откройте: https://s1wex69.github.io/pnae-steel-handbook/

## 4. Вставка в Tilda

Блок **T123** (HTML-код), содержимое — файл `docs/tilda-embed.html`:

```html
<div style="width:100%;max-width:1200px;margin:0 auto;">
  <iframe
    src="https://s1wex69.github.io/pnae-steel-handbook/"
    title="Справочник свойств сталей ПНАЭ"
    width="100%"
    height="1000"
    style="border:0;border-radius:12px;min-height:85vh;"
    loading="lazy"
  ></iframe>
</div>
```

## Обновление справочника

После изменений в коде:

```powershell
git add .
git commit -m "Обновление справочника"
git push
```

Сайт на GitHub Pages обновится автоматически.

## Примечание про приватный репозиторий

Если Pages не публикуется: **Settings → Pages** — проверьте видимость сайта, либо сделайте репозиторий **Public** (для бесплатного тарифа это надёжнее).
