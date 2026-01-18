import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { randomChar } from "@/lib/code-generator";
import { cn } from "@/lib/utils";

interface SlotReelProps {
	/** Target character to land on */
	target: string;
	/** Delay before animation starts (ms) */
	delayMs?: number;
	/** Height/width of each cell in pixels */
	cellPx?: number;
	/** Number of spin steps in the reel */
	spinSteps?: number;
}

/**
 * Slot reel that spins through a vertical list of characters and lands on `target`.
 * Animates only transform (translateY).
 */
export function SlotReel({
	target,
	delayMs = 0,
	cellPx = 48,
	spinSteps = 14,
}: SlotReelProps) {
	const reduceMotion = useReducedMotion();

	const reel = useMemo(() => {
		const arr = Array.from({ length: Math.max(6, spinSteps) }, () =>
			randomChar(),
		);
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
				"size-12",
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
