/** Выравнивает родительские блоки Tilda вокруг #root (ширина, центрирование). */
export function fixTildaEmbedHost() {
  const root = document.getElementById("root");
  if (!root) return;

  root.classList.add("pnae-tilda-embed");

  let el: HTMLElement | null = root.parentElement;
  for (let depth = 0; depth < 8 && el; depth++) {
    const tag = el.tagName;
    if (tag === "BODY" || tag === "HTML") break;

    el.style.setProperty("width", "100%", "important");
    el.style.setProperty("max-width", "100%", "important");
    el.style.setProperty("margin-left", "auto", "important");
    el.style.setProperty("margin-right", "auto", "important");
    el.style.setProperty("box-sizing", "border-box", "important");
    el.style.setProperty("overflow-x", "clip", "important");
    el.style.setProperty("overflow-y", "visible", "important");

    if (el.classList.contains("t-rec") || el.classList.contains("t-container")) {
      el.style.setProperty("padding-left", "0", "important");
      el.style.setProperty("padding-right", "0", "important");
      el.style.setProperty("padding-bottom", "0", "important");
      el.style.setProperty("background", "#f7f2eb", "important");
      if (el.classList.contains("t-rec") && window.self === window.top) {
        el.style.setProperty("padding-top", "5.5rem", "important");
      }
    }

    el = el.parentElement;
  }
}
