import { useEffect } from "react";

/** Прокрутка колёсиком срабатывает на всей странице, не только над полосой прокрутки. */
export function useDocumentWheelScroll() {
  useEffect(() => {
    const scrollRoot = document.scrollingElement ?? document.documentElement;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented) return;

      let node = e.target as HTMLElement | null;
      while (node && node !== document.body) {
        const { overflowY } = window.getComputedStyle(node);
        if (
          (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
          node.scrollHeight > node.clientHeight + 1
        ) {
          const atTop = node.scrollTop <= 0;
          const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            return;
          }
        }
        node = node.parentElement;
      }

      const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
      if (maxScroll <= 0) return;

      const next = Math.min(maxScroll, Math.max(0, scrollRoot.scrollTop + e.deltaY));
      if (next !== scrollRoot.scrollTop) {
        scrollRoot.scrollTop = next;
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);
}
