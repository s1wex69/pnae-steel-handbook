import { cn } from "@/lib/utils";
import {
  FLAT_HEAD_TYPE_LABELS,
  type FlatHeadAttachmentType,
} from "@/lib/flatHeadTable4Gost34233";

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, "/");

export function flatHeadSchemeImageUrl(type: FlatHeadAttachmentType): string {
  return `${BASE}images/flat-head/type-${String(type).padStart(2, "0")}.png`;
}

export function FlatHeadSchemeSelector({
  types,
  value,
  onChange,
}: {
  types: FlatHeadAttachmentType[];
  value: FlatHeadAttachmentType;
  onChange: (type: FlatHeadAttachmentType) => void;
}) {
  return (
    <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {types.map((type) => {
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              "flex h-full min-h-[248px] flex-col overflow-hidden rounded-lg border text-left transition-colors",
              selected
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 ring-2 ring-[var(--color-primary)]/30"
                : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/40"
            )}
          >
            <div className="box-border flex h-52 w-full shrink-0 items-center justify-center bg-[var(--color-card)] p-1 sm:h-56">
              <img
                src={flatHeadSchemeImageUrl(type)}
                alt={FLAT_HEAD_TYPE_LABELS[type]}
                className="h-full w-full object-contain object-center"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
            <div className="flex min-h-[3.75rem] flex-1 items-start border-t border-[var(--color-border)]/60 px-2.5 py-2.5">
              <p className="line-clamp-3 text-sm leading-snug text-[var(--color-heading)]">
                {FLAT_HEAD_TYPE_LABELS[type]}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
