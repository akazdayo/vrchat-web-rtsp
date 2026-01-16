import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs));
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function randomChar(rng: () => number = Math.random) {
  return CHARSET[Math.floor(rng() * CHARSET.length)];
}

export function generateCode(len = 4, rng: () => number = Math.random) {
  let s = "";
  for (let i = 0; i < len; i++) s += randomChar(rng);
  return s;
}

async function copyToClipboard(text: string) {
  // Primary: async Clipboard API
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback: execCommand (older browsers / non-secure contexts)
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  el.select();

  const ok = document.execCommand?.("copy") ?? false;
  document.body.removeChild(el);

  if (!ok) throw new Error("Copy failed");
}

/**
 * Slot reel that spins through a vertical list of characters and lands on `target`.
 * Animates only transform (translateY).
 */
function SlotReel({
  target,
  delayMs = 0,
  cellPx = 48,
  spinSteps = 14,
}: {
  target: string;
  delayMs?: number;
  cellPx?: number;
  spinSteps?: number;
}) {
  const reduceMotion = useReducedMotion();

  const reel = React.useMemo(() => {
    const arr = Array.from({ length: Math.max(6, spinSteps) }, () => randomChar());
    arr[arr.length - 1] = target;
    return arr;
  }, [target, spinSteps]);

  // Travel fewer steps to avoid overly-fast perceived scrolling at short durations.
  const travelSteps = Math.min(5, reel.length - 1);
  const yStart = -(reel.length - 1 - travelSteps) * cellPx;
  const yFinal = -(reel.length - 1) * cellPx;

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-lg border border-neutral-500/60 bg-white",
        "size-12"
      )}
      aria-label={`コード文字: ${target}`}
    >
      {reduceMotion ? (
        <div className="text-xl font-semibold tabular-nums" aria-hidden="true">
          {target}
        </div>
      ) : (
        <motion.div
          className="flex flex-col"
          initial={{ y: yStart }}
          animate={{ y: yFinal }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
            delay: delayMs / 1000,
          }}
          aria-hidden="true"
        >
          {reel.map((ch, idx) => (
            <div
              key={idx}
              className="grid size-12 place-items-center text-xl font-semibold tabular-nums"
              style={{ height: cellPx, width: cellPx }}
            >
              {ch}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function StreamingCodeMock() {
  const reduceMotion = useReducedMotion();
  const [started, setStarted] = React.useState(false);
  const [code, setCode] = React.useState("----");
  const [spinKey, setSpinKey] = React.useState(0);
  const [srMessage, setSrMessage] = React.useState("");

  const chars = React.useMemo(() => code.split(""), [code]);

  async function onStart() {
    const next = generateCode(4);
    setStarted(true);
    setCode(next);
    setSpinKey((k) => k + 1);

    // Keep UI identical to the reference: no visible copy toast.
    // Provide SR-only feedback only.
    try {
      await copyToClipboard(next);
      setSrMessage(`Copied ${next}`);
    } catch {
      setSrMessage("Copy failed");
    }
  }

  return (
    <div className="min-h-dvh bg-white grid place-items-center">
      <div className="grid place-items-center gap-3">
        {/* 4 slots */}
        <div className="flex items-center gap-4" key={spinKey}>
          {started ? (
            chars.map((ch, i) => (
              <SlotReel
                key={`${spinKey}-${i}`}
                target={ch}
                // slight stagger but total ~1s
                delayMs={reduceMotion ? 0 : i * 30}
                cellPx={48}
                spinSteps={14 + i * 2}
              />
            ))
          ) : (
            <>
              <div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
              <div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
              <div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
              <div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
            </>
          )}
        </div>

        {/* Button */}
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "w-60 rounded-md border border-neutral-500/60 bg-white px-4 py-1.5",
            "text-xs text-neutral-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
            "active:scale-[0.99] transition-transform"
          )}
        >
          画面共有
        </button>

        {/* Screen-reader-only feedback for copy result */}
        <div className="sr-only" aria-live="polite">
          {srMessage}
        </div>
      </div>
    </div>
  );
}
