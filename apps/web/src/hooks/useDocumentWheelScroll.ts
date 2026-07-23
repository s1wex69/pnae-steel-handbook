import { useEffect } from "react";

export const PNAE_EMBED_WHEEL_MESSAGE = "pnae-embed-wheel" as const;
export const PNAE_EMBED_HEIGHT_MESSAGE = "pnae-embed-height" as const;

function isFocusedFormField(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function findScrollableAncestor(start: HTMLElement | null): HTMLElement | null {
  let node = start;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function canConsumeWheel(el: HTMLElement, deltaY: number): boolean {
  if (deltaY === 0) return false;
  if (deltaY < 0) return el.scrollTop > 0;
  const max = el.scrollHeight - el.clientHeight;
  return el.scrollTop < max - 1;
}

function applyWheelScroll(deltaY: number): boolean {
  const scrollRoot = (document.scrollingElement ?? document.documentElement) as HTMLElement;
  const max = scrollRoot.scrollHeight - scrollRoot.clientHeight;
  if (max > 0) {
    const next = Math.min(max, Math.max(0, scrollRoot.scrollTop + deltaY));
    if (next !== scrollRoot.scrollTop) {
      scrollRoot.scrollTop = next;
      return true;
    }
  }

  const before = window.scrollY;
  window.scrollBy({ top: deltaY, left: 0, behavior: "instant" });
  return window.scrollY !== before;
}

function forwardWheelToParent(deltaY: number) {
  window.parent.postMessage({ type: PNAE_EMBED_WHEEL_MESSAGE, deltaY }, "*");
}

/** Слушатель для родительской страницы Tilda с iframe-вставкой. */
export function installEmbedParentWheelBridge(): () => void {
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type !== PNAE_EMBED_WHEEL_MESSAGE) return;
    const deltaY = Number(event.data.deltaY);
    if (!Number.isFinite(deltaY) || deltaY === 0) return;
    window.scrollBy({ top: deltaY, left: 0, behavior: "instant" });
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

/** Сообщает родительской странице Tilda высоту контента — iframe растягивается, скролл идёт у страницы. */
export function useEmbedHeightReporter() {
  useEffect(() => {
    if (window.self === window.top) return;

    let last = 0;
    let raf = 0;

    const measure = () => {
      const root = document.getElementById("root") ?? document.body;
      const height = Math.ceil(
        Math.max(
          root.scrollHeight,
          root.getBoundingClientRect().height,
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        )
      );
      if (height > 0 && Math.abs(height - last) >= 2) {
        last = height;
        window.parent.postMessage({ type: PNAE_EMBED_HEIGHT_MESSAGE, height }, "*");
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);
    const root = document.getElementById("root");
    if (root) ro.observe(root);

    window.addEventListener("load", schedule);
    const interval = window.setInterval(schedule, 1000);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("load", schedule);
      window.clearInterval(interval);
    };
  }, []);
}

/** Прокрутка колёсиком на всей странице, не только над полосой прокрутки. */
export function useDocumentWheelScroll() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      if (isFocusedFormField()) return;

      const target = e.target instanceof HTMLElement ? e.target : null;
      const scrollable = findScrollableAncestor(target);
      if (scrollable && canConsumeWheel(scrollable, e.deltaY)) {
        return;
      }

      if (applyWheelScroll(e.deltaY)) {
        e.preventDefault();
        return;
      }

      if (window.self !== window.top) {
        forwardWheelToParent(e.deltaY);
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
  }, []);
}
