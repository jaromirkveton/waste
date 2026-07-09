import { useEffect, useRef, useState } from "react";
import {
  formatDate,
  formatDateTime,
  formatRelativeCheck,
  getNextCollectionLabel,
} from "../services/api";
import type { BinDisplayItem } from "../types";
import { BinIcon } from "./BinIcon";
import { ProgressRing } from "./ProgressRing";

const binThemes: Record<number, { accent: string; iconBg: string }> = {
  5: {
    accent: "#3A6BFF",
    iconBg: "rgba(58,107,255,0.2)",
  },
  9: {
    accent: "#CA8A04",
    iconBg: "rgba(234,179,8,0.2)",
  },
  3: {
    accent: "#6B7280",
    iconBg: "rgba(107,114,128,0.2)",
  },
  1: {
    accent: "#16A34A",
    iconBg: "rgba(22,163,74,0.2)",
  },
};

const defaultTheme = {
  accent: "#6B7280",
  iconBg: "rgba(107,114,128,0.2)",
};

interface BinCardProps {
  bin: BinDisplayItem;
  isUpdating?: boolean;
}

function CheckedAtInfo({
  relative,
  exact,
}: {
  relative: string;
  exact: string | null;
}) {
  const [showTapTooltip, setShowTapTooltip] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supportsHoverRef = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches,
  );

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const revealTooltipOnTap = () => {
    if (!exact || supportsHoverRef.current) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    setShowTapTooltip(true);
    hideTimeoutRef.current = setTimeout(() => {
      setShowTapTooltip(false);
      hideTimeoutRef.current = null;
    }, 800);
  };

  if (!exact) {
    return (
      <p className="text-body-sm mt-1 text-black/50">{relative}</p>
    );
  }

  return (
    <div className="text-body-sm mt-1 flex items-center justify-center gap-1 text-black/50">
      <span>{relative}</span>
      <span className="group relative inline-flex">
        <button
          type="button"
          aria-label={`Přesný čas kontroly: ${exact}`}
          aria-expanded={showTapTooltip}
          onClick={revealTooltipOnTap}
          className="inline-flex rounded-full text-black/40 transition-colors hover:text-black/70 focus-visible:text-black/70 focus-visible:outline-none"
        >
          <svg
            className="size-3.5"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 7V11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="5" r="0.75" fill="currentColor" />
          </svg>
        </button>
        <span
          role="tooltip"
          className={`text-body-sm pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-white shadow-lg transition-opacity ${
            showTapTooltip ? "opacity-100" : "opacity-0"
          } group-hover:opacity-100 group-focus-within:opacity-100`}
        >
          {exact}
        </span>
      </span>
    </div>
  );
}

export function BinCard({ bin, isUpdating = false }: BinCardProps) {
  const nextPick = formatDate(bin.cleaning_frequency?.next_pick);
  const nextLabel = getNextCollectionLabel(bin.urgency);
  const fullness = bin.last_measurement?.percent_calculated;
  const checkedAt = formatRelativeCheck(bin.last_measurement?.measured_at_utc);
  const checkedAtExact = formatDateTime(bin.last_measurement?.measured_at_utc);
  const theme = binThemes[bin.trash_type.id] ?? defaultTheme;
  const hasFullness = typeof fullness === "number";

  return (
    <article
      className="relative flex w-full min-w-0 flex-col gap-2.5 rounded-[24px] bg-white px-6 py-5 shadow-[0px_6px_16px_-2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]"
    >
      {isUpdating && <div className="card-updating-shimmer" aria-hidden="true" />}
      <div className="flex w-full items-center gap-2">
        <div
          className="flex shrink-0 items-center rounded-[20px] p-1.5"
          style={{ backgroundColor: theme.iconBg }}
        >
          <BinIcon trashTypeId={bin.trash_type.id} color={theme.accent} />
        </div>
        <h3 className="text-body-bold text-ink">{bin.trash_type.description}</h3>
      </div>

      <div className="flex w-full flex-col items-center justify-center pb-12 pt-11">
        <div className="flex w-full flex-col items-center">
          <div className="flex items-center justify-center gap-3">
            {hasFullness && (
              <ProgressRing value={fullness} size={36} />
            )}
            <p className="text-headline-h1 text-ink">
              {hasFullness ? `${fullness} %` : "—"}
            </p>
          </div>
          {checkedAt && (
            <CheckedAtInfo relative={checkedAt} exact={checkedAtExact} />
          )}
        </div>
      </div>

      {nextPick && (
        <div className="flex flex-col gap-1.5">
          <p className="text-body-sm text-black/50">Příští svoz</p>
          <div className="flex items-center gap-1">
            {nextLabel && (
              <p className="text-body-sm-bold text-ink">{nextLabel}</p>
            )}
            <p className={nextLabel ? "text-body-sm text-black/50" : "text-body-sm-bold text-ink"}>
              {nextPick}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
